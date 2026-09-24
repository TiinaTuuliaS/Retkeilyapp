import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Injectable, NotFoundException, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { DataSource } from 'typeorm';

export function objectFields(value:unknown, keys:string[]) {
  if (!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).some(k=>!keys.includes(k))) throw new BadRequestException('Virheellinen lomake.');
  return value as Record<string,unknown>;
}
function text(value:unknown,max:number,required=true) {
  if(typeof value!=='string' || value.length>max || (required&&!value.trim())) throw new BadRequestException('Tarkista tekstikentät.');
  return value.trim();
}
function date(value:unknown) {
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value) throw new BadRequestException('Tarkista päivämäärä.');
  return value;
}
const friend = `(f.sender=$1 AND f.recipient=j.account_id OR f.recipient=$1 AND f.sender=j.account_id)`;
const tripColumns = `t.id,t.owner,t.title,t.destination,to_char(t.starts_on,'YYYY-MM-DD') AS "startsOn",to_char(t.ends_on,'YYYY-MM-DD') AS "endsOn",t.notes`;
@Injectable()
export class CommunityService {
  constructor(private db:DataSource) {}
  async friends(id:number) {
    return this.db.query(`SELECT CASE WHEN f.sender=$1 THEN f.recipient ELSE f.sender END AS id,a.display_name AS name,f.accepted,(f.recipient=$1) AS incoming
      FROM public.friendships f JOIN public.accounts a ON a.id=CASE WHEN f.sender=$1 THEN f.recipient ELSE f.sender END
      WHERE f.sender=$1 OR f.recipient=$1 ORDER BY a.display_name`,[id]);
  }
  async request(id:number,target:number) {
    if(target===id) throw new BadRequestException('Et voi lisätä itseäsi kaveriksi.');
    const rows=await this.db.query('SELECT id FROM public.accounts WHERE id=$1',[target]);
    if(!rows.length) throw new NotFoundException('Kaveritunnusta ei löydy.');
    await this.db.query('INSERT INTO public.friendships(sender,recipient) VALUES($1,$2) ON CONFLICT DO NOTHING',[id,target]);
    return {ok:true};
  }
  async accept(id:number,target:number) {
    const [rows]=await this.db.query('UPDATE public.friendships SET accepted=true WHERE sender=$2 AND recipient=$1 RETURNING sender',[id,target]);
    if(!rows.length) throw new NotFoundException('Kaveripyyntöä ei löydy.');
    return {ok:true};
  }
  async unfriend(id:number,target:number) {
    await this.db.query('DELETE FROM public.friendships WHERE (sender=$1 AND recipient=$2) OR (sender=$2 AND recipient=$1)',[id,target]);
    return {ok:true};
  }
  feed(id:number|null) {
    return this.db.query(`SELECT j.id,j.title,j.place,j.body,j.animal,j.visibility,to_char(j.visited_on,'YYYY-MM-DD') AS "visitedOn",a.display_name AS author
      FROM public.journal_entries j JOIN public.accounts a ON a.id=j.account_id
      WHERE j.visibility='public' OR (j.visibility='friends' AND (j.account_id=$1 OR EXISTS(SELECT 1 FROM public.friendships f WHERE f.accepted AND ${friend})))
      ORDER BY j.visited_on DESC,j.id DESC LIMIT 100`,[id]);
  }
  async publish(id:number,entry:number,value:unknown) {
    const b=objectFields(value,['visibility']);
    if(!['private','friends','public'].includes(b.visibility as string)) throw new BadRequestException('Valitse näkyvyys.');
    const [rows]=await this.db.query('UPDATE public.journal_entries SET visibility=$3 WHERE account_id=$1 AND id=$2 RETURNING id,visibility',[id,entry,b.visibility]);
    if(!rows.length) throw new NotFoundException('Merkintää ei löydy.');
    return rows[0];
  }
  async trips(id:number) {
    const rows=await this.db.query(`SELECT ${tripColumns},(t.owner=$1) AS "isOwner",COALESCE(m.accepted,false) AS joined,a.display_name AS organizer
      FROM public.trips t JOIN public.accounts a ON a.id=t.owner LEFT JOIN public.trip_members m ON m.trip_id=t.id AND m.account_id=$1
      WHERE t.owner=$1 OR m.account_id=$1 ORDER BY t.starts_on DESC,t.id DESC`,[id]);
    for(const row of rows) {
      if(row.isOwner || row.joined) row.members=await this.db.query(`SELECT m.account_id AS id,a.display_name AS name,m.accepted FROM public.trip_members m JOIN public.accounts a ON a.id=m.account_id WHERE m.trip_id=$1 ORDER BY a.display_name`,[row.id]);
      else { row.notes=''; row.members=[]; }
    }
    return rows;
  }
  async saveTrip(owner:number,id:number|null,value:unknown) {
    const b=objectFields(value,['title','destination','startsOn','endsOn','notes','previousNotes']);
    const args=[owner,text(b.title,120),text(b.destination,200),date(b.startsOn),date(b.endsOn),text(b.notes,10000,false)];
    if(args[4]<args[3]) throw new BadRequestException('Päättymispäivä ei voi olla ennen alkua.');
    if(id===null) return (await this.db.query('INSERT INTO public.trips(owner,title,destination,starts_on,ends_on,notes) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',args))[0];
    const previous=text(b.previousNotes,10000,false);
    const owned=await this.db.query('SELECT id FROM public.trips WHERE owner=$1 AND id=$2',[owner,id]);
    if(!owned.length) throw new NotFoundException('Retkeä ei löydy.');
    const [rows]=await this.db.query('UPDATE public.trips SET title=$2,destination=$3,starts_on=$4,ends_on=$5,notes=$6 WHERE owner=$1 AND id=$7 AND notes=$8 RETURNING id',[...args,id,previous]);
    if(!rows.length) throw new ConflictException('Muistiinpanot ovat muuttuneet. Päivitä tiedot ja avaa muokkaus uudelleen. Kopioi omat muutoksesi ensin talteen.');
    return rows[0];
  }
  async invite(owner:number,trip:number,target:number) {
    const rows=await this.db.query(`SELECT t.id FROM public.trips t WHERE t.id=$2 AND t.owner=$1 AND EXISTS(SELECT 1 FROM public.friendships WHERE accepted AND ((sender=$1 AND recipient=$3) OR (sender=$3 AND recipient=$1)))`,[owner,trip,target]);
    if(!rows.length) throw new BadRequestException('Voit kutsua vain hyväksytyn kaverin omalle retkellesi.');
    await this.db.query('INSERT INTO public.trip_members(trip_id,account_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[trip,target]);
    return {ok:true};
  }
  async join(id:number,trip:number) {
    const [rows]=await this.db.query('UPDATE public.trip_members SET accepted=true WHERE trip_id=$2 AND account_id=$1 RETURNING trip_id',[id,trip]);
    if(!rows.length) throw new NotFoundException('Kutsua ei löydy.');
    return {ok:true};
  }
  async removeMember(id:number,trip:number,target:number) {
    await this.db.query('DELETE FROM public.trip_members WHERE trip_id=$2 AND account_id=$3 AND ($1=$3 OR EXISTS(SELECT 1 FROM public.trips WHERE id=$2 AND owner=$1))',[id,trip,target]);
    return {ok:true};
  }
  async notes(id:number,trip:number,value:unknown) {
    const b=objectFields(value,['notes','previousNotes']);
    const access='(owner=$1 OR EXISTS(SELECT 1 FROM public.trip_members WHERE trip_id=$2 AND account_id=$1 AND accepted))';
    const allowed=await this.db.query(`SELECT id FROM public.trips WHERE id=$2 AND ${access}`,[id,trip]);
    if(!allowed.length) throw new NotFoundException('Retkeä ei löydy.');
    const [rows]=await this.db.query(`UPDATE public.trips SET notes=$3 WHERE id=$2 AND ${access} AND notes=$4 RETURNING id`,[id,trip,text(b.notes,10000,false),text(b.previousNotes,10000,false)]);
    if(!rows.length) throw new ConflictException('Muistiinpanot ovat muuttuneet. Päivitä tiedot ja avaa muokkaus uudelleen. Kopioi omat muutoksesi ensin talteen.');
    return {ok:true};
  }
  async removeTrip(id:number,trip:number) {
    const [rows]=await this.db.query('DELETE FROM public.trips WHERE id=$2 AND owner=$1 RETURNING id',[id,trip]);
    if(!rows.length) throw new NotFoundException('Retkeä ei löydy.');
    return {ok:true};
  }
}
@Controller('community')
export class PublicCommunityController {
  constructor(private service:CommunityService) {}
  @Get() feed() { return this.service.feed(null); }
}
@Controller('account')
export class CommunityController {
  constructor(private service:CommunityService) {}
  @Get('friends') friends(@Req() r) { return this.service.friends(r.account.id); }
  @Post('friends/:id') request(@Req() r,@Param('id',ParseIntPipe) id:number) { return this.service.request(r.account.id,id); }
  @Put('friends/:id') accept(@Req() r,@Param('id',ParseIntPipe) id:number) { return this.service.accept(r.account.id,id); }
  @Delete('friends/:id') remove(@Req() r,@Param('id',ParseIntPipe) id:number) { return this.service.unfriend(r.account.id,id); }
  @Get('feed') feed(@Req() r) { return this.service.feed(r.account.id); }
  @Put('journal/:id/visibility') publish(@Req() r,@Param('id',ParseIntPipe) id:number,@Body() b:unknown) { return this.service.publish(r.account.id,id,b); }
  @Get('trips') trips(@Req() r) { return this.service.trips(r.account.id); }
  @Post('trips') create(@Req() r,@Body() b:unknown) { return this.service.saveTrip(r.account.id,null,b); }
  @Put('trips/:id') edit(@Req() r,@Param('id',ParseIntPipe) id:number,@Body() b:unknown) { return this.service.saveTrip(r.account.id,id,b); }
  @Delete('trips/:id') delete(@Req() r,@Param('id',ParseIntPipe) id:number) { return this.service.removeTrip(r.account.id,id); }
  @Post('trips/:id/invites/:target') invite(@Req() r,@Param('id',ParseIntPipe) id:number,@Param('target',ParseIntPipe) target:number) { return this.service.invite(r.account.id,id,target); }
  @Put('trips/:id/join') join(@Req() r,@Param('id',ParseIntPipe) id:number) { return this.service.join(r.account.id,id); }
  @Delete('trips/:id/members/:target') leave(@Req() r,@Param('id',ParseIntPipe) id:number,@Param('target',ParseIntPipe) target:number) { return this.service.removeMember(r.account.id,id,target); }
  @Put('trips/:id/notes') notes(@Req() r,@Param('id',ParseIntPipe) id:number,@Body() b:unknown) { return this.service.notes(r.account.id,id,b); }
}
