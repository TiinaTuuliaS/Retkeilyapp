import { AccountsService, credentials, hashPassword, verifyPassword } from './accounts';
describe('Accounts',()=>{
  it('salts passwords and verifies without storing plaintext',async()=>{
    const a=await hashPassword('long test password'),b=await hashPassword('long test password');
    expect(a).not.toBe(b); expect(a).not.toContain('long test password');
    expect(await verifyPassword('long test password',a)).toBe(true);
    expect(await verifyPassword('wrong password',a)).toBe(false);
  });
  it.each([{email:'bad',password:'long test password',displayName:'Test'},
    {email:'a@example.com',password:'short',displayName:'Test'},
    {email:'a@example.com',password:'long test password',displayName:'Test',id:1}])('rejects malformed or overposted registration',body=>{
    expect(()=>credentials(body,true)).toThrow();
  });
  it('limits attempts before password hashing',()=>{
    const service=new AccountsService({} as any);
    for(let i=0;i<20;i++) service.limit('test');
    expect(()=>service.limit('test')).toThrow();
  });
});
