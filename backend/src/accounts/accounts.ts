import { BadRequestException, Body, CanActivate, ConflictException, Controller, Delete, ExecutionContext, ForbiddenException, Get, Global, HttpException, Injectable, Module, Param, ParseIntPipe, Post, Put, Req, Res, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JournalController, JournalService } from './journal';
import { CommunityService, CommunityController, PublicCommunityController } from './community';
import { DataSource } from 'typeorm';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';

export const frontendOrigin = () => process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const cookieName = () => process.env.NODE_ENV === 'production' ? '__Host-konkari' : 'konkari_session';
const cookieOptions = () => ({ httpOnly:true, sameSite:'strict' as const, secure:process.env.NODE_ENV === 'production', path:'/' });
type User = { id:number; email:string; displayName:string; role:'user'|'admin' };
type AuthRequest = Request & { account?:User };
const digest = (token:string) => createHash('sha256').update(token).digest('hex');
function token(req:Request) {
  const value = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith(cookieName()+'='))?.slice(cookieName().length+1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
async function derive(password:string,salt:string):Promise<Buffer> {
  return new Promise((resolve,reject) => scrypt(password,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024},(err,key) => err ? reject(err) : resolve(key)));
}
export async function hashPassword(password:string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt-v1$${salt}$${(await derive(password,salt)).toString('hex')}`;
}
export async function verifyPassword(password:string,stored:string) {
  const [version,salt,hash] = stored.split('$');
  if (version !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) return false;
  return timingSafeEqual(await derive(password,salt),Buffer.from(hash,'hex'));
}
export function credentials(body:unknown,register:boolean) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Virheellinen lomake.');
  const b = body as Record<string,unknown>;
  if (Object.keys(b).some(k => !(register ? ['email','password','displayName'] : ['email','password']).includes(k))) throw new BadRequestException('Ylimääräisiä kenttiä.');
  if (typeof b.email !== 'string' || b.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim())) throw new BadRequestException('Anna sähköpostiosoite.');
  if (typeof b.password !== 'string' || b.password.length<12 || b.password.length>128) throw new BadRequestException('Salasanan pituus on 12–128 merkkiä.');
  if (register && (typeof b.displayName !== 'string' || b.displayName.trim().length<2 || b.displayName.trim().length>60)) throw new BadRequestException('Nimimerkin pituus on 2–60 merkkiä.');
  return { email:b.email.trim().toLowerCase(),password:b.password,displayName:register ? (b.displayName as string).trim() : '' };
}

@Injectable()
export class AccountsService {
  constructor(private db:DataSource) {}
  private attempts = new Map<string,{n:number;until:number}>();
  limit(ip:string) {
    const now=Date.now();
    for (const [key,value] of this.attempts) if(value.until<now) this.attempts.delete(key);
    const entry=this.attempts.get(ip) || {n:0,until:now+15*60*1000};
    if (entry.n>=20 || (!this.attempts.has(ip) && this.attempts.size>=10000)) throw new HttpException('Liian monta yritystä. Kokeile myöhemmin uudelleen.',429);
    entry.n++; this.attempts.set(ip,entry);
  }
  async current(req:Request):Promise<User|null> {
    const value=token(req); if(!value) return null;
    const rows=await this.db.query(`SELECT a.id,a.email,a.display_name AS "displayName",a.role FROM public.account_sessions s
      JOIN public.accounts a ON a.id=s.account_id WHERE s.token_hash=$1 AND s.expires_at>now()`,[digest(value)]);
    return rows[0] || null;
  }
  async login(body:unknown,register:boolean,req:Request,res:Response) {
    this.limit(req.ip || 'unknown');
    const input=credentials(body,register);
    let account;
    if(register) {
      const hash=await hashPassword(input.password);
      try {
        [account]=await this.db.query(`INSERT INTO public.accounts(email,display_name,password_hash) VALUES($1,$2,$3)
          RETURNING id,email,display_name AS "displayName",role`,[input.email,input.displayName,hash]);
      } catch(e) { if(e.code==='23505') throw new ConflictException('Tiliä ei voitu luoda tällä sähköpostilla. Kokeile kirjautumista.'); throw e; }
    } else {
      const [row]=await this.db.query('SELECT id,email,display_name AS "displayName",password_hash,role FROM public.accounts WHERE email=$1',[input.email]);
      // Equal-cost password derivation also for unknown addresses.
      const dummy=`scrypt-v1$${'0'.repeat(32)}$${'0'.repeat(128)}`;
      const ok=await verifyPassword(input.password,row?.password_hash || dummy);
      if(!row || !ok) throw new UnauthorizedException('Sähköposti tai salasana on väärin.');
      account={id:row.id,email:row.email,displayName:row.displayName,role:row.role};
    }
    const value=randomBytes(32).toString('hex');
    await this.db.transaction(async manager => {
      if(token(req)) await manager.query('DELETE FROM public.account_sessions WHERE token_hash=$1',[digest(token(req)!)]);
      await manager.query('DELETE FROM public.account_sessions WHERE expires_at<=now()');
      await manager.query("INSERT INTO public.account_sessions(token_hash,account_id,expires_at) VALUES($1,$2,now()+interval '7 days')",[digest(value),account.id]);
    });
    res.cookie(cookieName(),value,{...cookieOptions(),maxAge:7*86400000});
    return account;
  }
  async logout(req:Request,res:Response) {
    if(token(req)) await this.db.query('DELETE FROM public.account_sessions WHERE token_hash=$1',[digest(token(req)!)]);
    res.clearCookie(cookieName(),cookieOptions());
    return {ok:true};
  }
  async profile(id:number) {
    const saved=await this.db.query(`SELECT l.id,l.name,l.type FROM public.saved_locations s JOIN public.locations l ON l.id=s.location_id WHERE s.account_id=$1 ORDER BY s.created_at DESC`,[id]);
    const observations=await this.db.query(`SELECT r.id,'report' AS kind,r.status,r.target,r.comment,NULL::text AS "observedOn",l.id AS "locationId",l.name
      FROM public.reports r JOIN public.locations l ON l.id=r.location_id WHERE r.account_id=$1
      UNION ALL SELECT w.id,'water',w.availability,w.kind,w.directions,to_char(w.observed_on,'YYYY-MM-DD'),l.id,l.name
      FROM public.water_observations w JOIN public.locations l ON l.id=w.location_id WHERE w.account_id=$1
      UNION ALL SELECT u.id,'usage',u.status,'general',u.comment,to_char(u.observed_on,'YYYY-MM-DD'),l.id,l.name
      FROM public.usage_observations u JOIN public.locations l ON l.id=u.location_id WHERE u.account_id=$1
      ORDER BY "observedOn" DESC NULLS LAST,id DESC`,[id]);
    return {saved,observations};
  }
  async save(accountId:number,locationId:number,remove:boolean) {
    if(locationId<1 || locationId>2147483647) throw new BadRequestException('Virheellinen kohde.');
    if(remove) await this.db.query('DELETE FROM public.saved_locations WHERE account_id=$1 AND location_id=$2',[accountId,locationId]);
    else {
      const rows=await this.db.query('SELECT id FROM public.locations WHERE id=$1',[locationId]);
      if(!rows.length) throw new BadRequestException('Kohdetta ei löydy.');
      await this.db.query('INSERT INTO public.saved_locations(account_id,location_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[accountId,locationId]);
    }
    return {ok:true};
  }
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private accounts:AccountsService) {}
  async canActivate(context:ExecutionContext) {
    const req=context.switchToHttp().getRequest<AuthRequest>();
    const res=context.switchToHttp().getResponse<Response>();
    const write=!['GET','HEAD','OPTIONS'].includes(req.method);
    const privateRead=req.path.startsWith('/account');
    if(req.path.startsWith('/auth') || req.path.startsWith('/community') || privateRead) res.setHeader('Cache-Control','no-store');
    if(write && req.headers.origin!==frontendOrigin()) throw new ForbiddenException('Pyyntö ei tullut sovelluksesta.');
    if(!write && !privateRead) return true;
    if(['/auth/login','/auth/register','/auth/logout'].includes(req.path)) return true;
    const user=await this.accounts.current(req);
    if(!user) throw new UnauthorizedException('Kirjaudu sisään jatkaaksesi.');
    req.account=user;
    return true;
  }
}
@Controller('auth')
export class AuthController {
  constructor(private accounts:AccountsService) {}
  @Get('me') me(@Req() req:Request) { return this.accounts.current(req); }
  @Post('register') register(@Body() body:unknown,@Req() req:Request,@Res({passthrough:true}) res:Response) { return this.accounts.login(body,true,req,res); }
  @Post('login') login(@Body() body:unknown,@Req() req:Request,@Res({passthrough:true}) res:Response) { return this.accounts.login(body,false,req,res); }
  @Post('logout') logout(@Req() req:Request,@Res({passthrough:true}) res:Response) { return this.accounts.logout(req,res); }
}
@Controller('account')
export class AccountController {
  constructor(private accounts:AccountsService) {}
  @Get() profile(@Req() req:AuthRequest) { return this.accounts.profile(req.account!.id); }
  @Put('saved/:id') save(@Req() req:AuthRequest,@Param('id',ParseIntPipe) id:number) { return this.accounts.save(req.account!.id,id,false); }
  @Delete('saved/:id') remove(@Req() req:AuthRequest,@Param('id',ParseIntPipe) id:number) { return this.accounts.save(req.account!.id,id,true); }
}
@Global()
@Module({providers:[AccountsService,JournalService,CommunityService,{provide:APP_GUARD,useClass:SessionGuard}],controllers:[AuthController,AccountController,JournalController,CommunityController,PublicCommunityController],exports:[AccountsService]})
export class AccountsModule {}
