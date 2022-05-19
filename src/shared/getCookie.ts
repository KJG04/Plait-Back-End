const getCookie = (cookieSrc: string, cname: string): string | null => {
  const name = cname + '=';
  if (cookieSrc) {
    const ca = cookieSrc.split(';');
    for (let obj of ca) {
      while (obj.charAt(0) === ' ') {
        obj = obj.substring(1);
      }
      if (obj.indexOf(name) === 0) {
        return obj.substring(name.length, obj.length);
      }
    }
  }
  return null;
};

export default getCookie;
