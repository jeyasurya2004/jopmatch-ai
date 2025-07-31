declare module 'docx4js' {
  export function load(data: ArrayBuffer): Promise<any>;
  export function parse(data: ArrayBuffer): Promise<any>;
  export default {
    load,
    parse
  };
}
