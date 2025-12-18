// app/lib/crypto.ts

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const w = (x: number): number => {
    if (x >= 65 && x <= 90) return 155 - x;
    if (x >= 97 && x <= 122) return 219 - x;
    return x;
};

export function encrypt(text: string, pw: string): string {
    const p = pw.split('').map(c => c.charCodeAt(0));
    const s = Math.floor(Math.random() * 25) + 1;
    let res = String.fromCharCode(s + 65);

    for (let i = 0; i < text.length; i++) {
        const n = text.charCodeAt(i);
        const shift = p[i % p.length] + s;
        if ((n >= 65 && n <= 90) || (n >= 97 && n <= 122)) {
            const base = (n >= 65 && n <= 90) ? 65 : 97;
            res += String.fromCharCode(((w(n) - base + shift) % 26) + base);
        } else if (n >= 48 && n <= 57) {
            res += String.fromCharCode(((n - 48 + shift) % 10) + 48);
        } else {
            res += text[i];
        }
    }
    return Buffer.from(res).toString('base64');
}

export function decrypt(cipher: string, pw: string): string {
    const data = Buffer.from(cipher, 'base64').toString();
    const p = pw.split('').map(c => c.charCodeAt(0));
    const s = data.charCodeAt(0) - 65;
    let res = '';

    for (let i = 1; i < data.length; i++) {
        const n = data.charCodeAt(i);
        const shift = p[(i - 1) % p.length] + s;
        if ((n >= 65 && n <= 90) || (n >= 97 && n <= 122)) {
            const base = (n >= 65 && n <= 90) ? 65 : 97;
            const u = (n - base - (shift % 26) + 26) % 26 + base;
            res += String.fromCharCode(w(u));
        } else if (n >= 48 && n <= 57) {
            res += String.fromCharCode(((n - 48 - (shift % 10) + 10) % 10) + 48);
        } else {
            res += data[i];
        }
    }
    return res;
}
