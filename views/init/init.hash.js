/*produce length40 alnum hash*/ function _hash (a){var e = function (a){ if (!a) a= new String(); else a = a.toString(); a=a.replace(/\r\n/g,"\n");var b="";for(var c=0;c<a.length;c++){var d=a.charCodeAt(c);if(d<128){b+=String.fromCharCode(d)}else if(d>127&&d<2048){b+=String.fromCharCode(d>>6|192);b+=String.fromCharCode(d&63|128)}else{b+=String.fromCharCode(d>>12|224);b+=String.fromCharCode(d>>6&63|128);b+=String.fromCharCode(d&63|128)}}return b};var d = function (a){var b="";var c;var d;for(c=7;c>=0;c--){d=a>>>c*4&15;b+=d.toString(16)}return b};var c = function (a){var b="";var c;var d;var e;for(c=0;c<=6;c+=2){d=a>>>c*4+4&15;e=a>>>c*4&15;b+=d.toString(16)+e.toString(16)}return b};var b = function (a,b){var c=a<<b|a>>>32-b;return c};var f;var g,h;var i=new Array(80);var j=1732584193;var k=4023233417;var l=2562383102;var m=271733878;var n=3285377520;var o,p,q,r,s;var t;a=e(a);var u=a.length;var v=new Array;for(g=0;g<u-3;g+=4){h=a.charCodeAt(g)<<24|a.charCodeAt(g+1)<<16|a.charCodeAt(g+2)<<8|a.charCodeAt(g+3);v.push(h)}switch(u%4){case 0:g=2147483648;break;case 1:g=a.charCodeAt(u-1)<<24|8388608;break;case 2:g=a.charCodeAt(u-2)<<24|a.charCodeAt(u-1)<<16|32768;break;case 3:g=a.charCodeAt(u-3)<<24|a.charCodeAt(u-2)<<16|a.charCodeAt(u-1)<<8|128;break}v.push(g);while(v.length%16!=14)v.push(0);v.push(u>>>29);v.push(u<<3&4294967295);for(f=0;f<v.length;f+=16){for(g=0;g<16;g++)i[g]=v[f+g];for(g=16;g<=79;g++)i[g]=b(i[g-3]^i[g-8]^i[g-14]^i[g-16],1);o=j;p=k;q=l;r=m;s=n;for(g=0;g<=19;g++){t=b(o,5)+(p&q|~p&r)+s+i[g]+1518500249&4294967295;s=r;r=q;q=b(p,30);p=o;o=t}for(g=20;g<=39;g++){t=b(o,5)+(p^q^r)+s+i[g]+1859775393&4294967295;s=r;r=q;q=b(p,30);p=o;o=t}for(g=40;g<=59;g++){t=b(o,5)+(p&q|p&r|q&r)+s+i[g]+2400959708&4294967295;s=r;r=q;q=b(p,30);p=o;o=t}for(g=60;g<=79;g++){t=b(o,5)+(p^q^r)+s+i[g]+3395469782&4294967295;s=r;r=q;q=b(p,30);p=o;o=t}j=j+o&4294967295;k=k+p&4294967295;l=l+q&4294967295;m=m+r&4294967295;n=n+s&4294967295}var t=d(j)+d(k)+d(l)+d(m)+d(n);return t.toLowerCase()};