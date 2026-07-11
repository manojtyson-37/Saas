import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies a password', async () => {
    const hash = await service.hash('Str0ng-password!');
    expect(hash).toMatch(/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
    await expect(service.verify('Str0ng-password!', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await service.hash('correct-horse-1');
    await expect(service.verify('wrong-horse-1', hash)).resolves.toBe(false);
  });

  it('produces unique salts per hash', async () => {
    const a = await service.hash('same-input-9');
    const b = await service.hash('same-input-9');
    expect(a).not.toEqual(b);
  });

  it('rejects null/empty/malformed stored hashes', async () => {
    await expect(service.verify('x', null)).resolves.toBe(false);
    await expect(service.verify('x', '')).resolves.toBe(false);
    await expect(service.verify('x', 'bcrypt:oops')).resolves.toBe(false);
    await expect(service.verify('x', 'scrypt:onlysalt')).resolves.toBe(false);
  });
});
