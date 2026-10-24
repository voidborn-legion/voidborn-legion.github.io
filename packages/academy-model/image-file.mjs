export const MAX_IMAGE_BYTES=2*1024*1024;
export const MAX_IMAGE_BASE64=Math.ceil(MAX_IMAGE_BYTES/3)*4;

// Shared by browser uploads, native ChatGPT files and direct migration imports.
// The signature determines the type; callers cannot select an extension or URL.
export function decodeImageBase64(base64){
 if(typeof base64!=='string'||!base64.length)throw new Error('Ungültige Bilddatei.');
 if(base64.length>MAX_IMAGE_BASE64)throw new Error('Bild ist größer als 2 MiB.');
 if(base64.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))throw new Error('Ungültige Base64-Bilddatei.');
 const bytes=Buffer.from(base64,'base64');
 if(bytes.length>MAX_IMAGE_BYTES)throw new Error('Bild ist größer als 2 MiB.');
 if(bytes.toString('base64')!==base64)throw new Error('Ungültige Base64-Bilddatei.');
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!png&&!jpg&&!webp)throw new Error('Bitte PNG, JPEG oder WebP verwenden.');
 return {bytes,extension:png?'png':jpg?'jpg':'webp'};
}
