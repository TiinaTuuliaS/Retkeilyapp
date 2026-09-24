import { BadRequestException, Body, Controller, Delete, Get, Injectable, NotFoundException, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { DataSource } from 'typeorm';

function fields(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) throw new BadRequestException('Virheellinen lomake.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, required = false): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new BadRequestException('Tarkista tekstikenttien pituudet.');
  return value.trim();
}
export function profileInput(value: unknown) {
  const b = fields(value, ['bio', 'avatar']);
  const bio = text(b.bio, 500), avatar = text(b.avatar, 80000);
  // Inline JPEG only: no remote tracking URLs, SVG or executable content.
  if (avatar && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar) || !Buffer.from(avatar.split(',')[1], 'base64').subarray(0,3).equals(Buffer.from([255,216,255])))) throw new BadRequestException('Valitse JPEG-profiilikuva.');
  return { bio, avatar };
}
export function journalInput(value: unknown) {
  const b = fields(value, ['title', 'visitedOn', 'place', 'body', 'animal']);
  const title = text(b.title, 120, true), place = text(b.place, 160), body = text(b.body, 10000, true);
  const date = b.visitedOn;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) throw new BadRequestException('Anna kelvollinen retkipäivä.');
  return { title, place, body, visitedOn: date, animal: text(b.animal ?? '',120) };
}
const columns = `id,title,place,body,animal,visibility,to_char(visited_on,'YYYY-MM-DD') AS "visitedOn"`;
@Injectable()
export class JournalService {
  constructor(private db: DataSource) {}
  async profile(id: number) { return (await this.db.query('SELECT bio,avatar FROM public.accounts WHERE id=$1',[id]))[0]; }
  async updateProfile(id: number, value: unknown) {
    const b = profileInput(value);
    return (await this.db.query('UPDATE public.accounts SET bio=$2,avatar=$3 WHERE id=$1 RETURNING bio,avatar',[id,b.bio,b.avatar]))[0][0];
  }
  list(id: number) { return this.db.query(`SELECT ${columns} FROM public.journal_entries WHERE account_id=$1 ORDER BY visited_on DESC,id DESC`,[id]); }
  async save(owner: number, id: number | null, value: unknown) {
    const b = journalInput(value), args = [owner,b.title,b.visitedOn,b.place,b.body,b.animal];
    const rows = id === null
      ? await this.db.query(`INSERT INTO public.journal_entries(account_id,title,visited_on,place,body,animal) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${columns}`,args)
      : (await this.db.query(`UPDATE public.journal_entries SET title=$2,visited_on=$3,place=$4,body=$5,animal=$6,updated_at=now() WHERE account_id=$1 AND id=$7 RETURNING ${columns}`,[...args,id]))[0];
    if (!rows.length) throw new NotFoundException('Merkintää ei löydy.');
    return rows[0];
  }
  async remove(owner: number, id: number) {
    const [rows] = await this.db.query('DELETE FROM public.journal_entries WHERE account_id=$1 AND id=$2 RETURNING id',[owner,id]);
    if (!rows.length) throw new NotFoundException('Merkintää ei löydy.');
    return {ok:true};
  }
}
@Controller('account')
export class JournalController {
  constructor(private journal: JournalService) {}
  @Get('profile') profile(@Req() req) { return this.journal.profile(req.account.id); }
  @Put('profile') update(@Req() req,@Body() body: unknown) { return this.journal.updateProfile(req.account.id,body); }
  @Get('journal') list(@Req() req) { return this.journal.list(req.account.id); }
  @Post('journal') create(@Req() req,@Body() body: unknown) { return this.journal.save(req.account.id,null,body); }
  @Put('journal/:id') edit(@Req() req,@Param('id',ParseIntPipe) id: number,@Body() body: unknown) { return this.journal.save(req.account.id,id,body); }
  @Delete('journal/:id') remove(@Req() req,@Param('id',ParseIntPipe) id: number) { return this.journal.remove(req.account.id,id); }
}
