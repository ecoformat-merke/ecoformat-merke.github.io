/* ECO CLUB / Green Planet 3.0 — progressive WebGL globe
   Uses local, cacheable satellite imagery and clouds. The existing CSS globe
   remains fully functional if WebGL, decoding or networking is unavailable. */
(function(){
  'use strict';
  var hit=document.getElementById('ecoOrbitGlobe');
  var canvas=document.getElementById('ecoEarthWebgl');
  if(!hit||!canvas||!window.WebGLRenderingContext)return;
  var lowMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var inView=false, ready=false, started=false, busy=false, raf=0, startStamp=0;
  var gl,program,buffer,texEarth,texCloud,aPos,uTime,uEarth,uCloud;
  var vert='attribute vec2 aPos;varying vec2 vPos;void main(){vPos=aPos;gl_Position=vec4(aPos,0.,1.);}';
  var frag=[
    'precision highp float;',
    'varying vec2 vPos;',
    'uniform sampler2D uEarth;',
    'uniform sampler2D uCloud;',
    'uniform float uTime;',
    'const float PI=3.141592653589793;',
    'void main(){',
    ' vec2 p=vec2(vPos.x,-vPos.y);',
    ' float r2=dot(p,p);',
    ' if(r2>1.0)discard;',
    ' float depth=sqrt(max(0.0,1.0-r2));',
    ' vec3 norm=normalize(vec3(p.x,p.y,depth));',
    ' float lng=atan(norm.x,norm.z)+0.23+uTime*0.115;',
    ' float lat=asin(clamp(norm.y,-1.0,1.0));',
    ' vec2 uv=vec2(fract(0.5+lng/(2.0*PI)),clamp(0.5+lat/PI,0.003,0.997));',
    ' vec3 raw=texture2D(uEarth,uv).rgb;',
    ' float ocean=smoothstep(0.045,0.20,raw.b-max(raw.r,raw.g));',
    ' vec3 oceanCol=mix(raw,vec3(0.075,0.55,0.66),0.42);',
    ' vec3 landCol=vec3(raw.r*1.05,raw.g*1.20+0.04,raw.b*0.93);',
    ' vec3 color=mix(landCol,oceanCol,ocean);',
    ' vec2 cloudUv=vec2(fract(uv.x+uTime*0.0035),uv.y);',
    ' vec3 cloud=texture2D(uCloud,cloudUv).rgb;',
    ' float cloudDensity=clamp((dot(cloud,vec3(0.3333))-0.34)*1.6,0.0,0.82);',
    ' color=mix(color,vec3(0.97,0.99,0.97),cloudDensity*0.65);',
    ' vec3 lightDir=normalize(vec3(-0.45,0.60,0.88));',
    ' float diffuse=max(dot(norm,lightDir),0.0);',
    ' float illuminated=0.64+0.54*diffuse;',
    ' color=color*illuminated;',
    ' float atmosphere=pow(1.0-depth,3.1);',
    ' color+=vec3(0.19,0.72,0.57)*atmosphere*0.68;',
    ' color+=vec3(0.10,0.26,0.18)*pow(max(dot(norm,lightDir),0.0),20.0)*0.35;',
    ' gl_FragColor=vec4(pow(clamp(color,0.0,1.0),vec3(0.88)),1.0);',
    '}'
  ].join('\n');
  function shader(type,source){
    var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
      var msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('Earth shader: '+msg);
    }return s;
  }
  function createProgram(){
    var v=shader(gl.VERTEX_SHADER,vert),f=shader(gl.FRAGMENT_SHADER,frag);
    var p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
    gl.deleteShader(v);gl.deleteShader(f);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('Earth rendering unavailable');
    return p;
  }
  function decodeEmbeddedImage(filename){
    return fetch('./'+filename,{cache:'force-cache'}).then(function(r){
      if(!r.ok)throw new Error('Texture unavailable: '+filename);
      return r.text();
    }).then(function(svg){
      var match=/data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)/.exec(svg);
      if(!match)throw new Error('Invalid local Earth texture: '+filename);
      var raw=atob(match[2]),length=raw.length,bytes=new Uint8Array(length);
      for(var i=0;i<length;i++)bytes[i]=raw.charCodeAt(i);
      var url=URL.createObjectURL(new Blob([bytes],{type:match[1]}));
      return new Promise(function(resolve,reject){
        var image=new Image();
        image.onload=function(){URL.revokeObjectURL(url);resolve(image)};
        image.onerror=function(){URL.revokeObjectURL(url);reject(new Error('Texture decode failed'))};
        image.src=url;
      });
    });
  }
  function upload(image){
    var texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    return texture;
  }
  function resize(){
    var bounds=canvas.getBoundingClientRect();
    var dim=Math.min(740,Math.max(96,Math.round(bounds.width*Math.min(window.devicePixelRatio||1,1.7))));
    if(canvas.width!==dim||canvas.height!==dim){canvas.width=dim;canvas.height=dim;}
    if(gl)gl.viewport(0,0,dim,dim);
  }
  function paint(seconds){
    if(!ready||!gl)return;
    resize();gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texEarth);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texCloud);
    gl.uniform1i(uEarth,0);gl.uniform1i(uCloud,1);
    gl.uniform1f(uTime,seconds);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  function tick(now){
    raf=0;
    if(!inView||document.hidden||!ready)return;
    if(!startStamp)startStamp=now;
    paint(lowMotion?0:(now-startStamp)/1000);
    if(!lowMotion)raf=requestAnimationFrame(tick);
  }
  function run(){
    if(!ready||!inView||document.hidden||raf)return;
    raf=requestAnimationFrame(tick);
  }
  function initialize(){
    if(started||busy)return;
    busy=true;started=true;
    try{
      gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
      if(!gl)throw new Error('WebGL unsupported');
      program=createProgram();
      aPos=gl.getAttribLocation(program,'aPos');
      uTime=gl.getUniformLocation(program,'uTime');
      uEarth=gl.getUniformLocation(program,'uEarth');
      uCloud=gl.getUniformLocation(program,'uCloud');
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      gl.clearColor(0,0,0,0);gl.disable(gl.DEPTH_TEST);
      Promise.all([
        decodeEmbeddedImage('eco-earth-satellite.svg'),
        decodeEmbeddedImage('eco-earth-cloud-layer.svg')
      ]).then(function(images){
        texEarth=upload(images[0]);texCloud=upload(images[1]);
        ready=true;resize();paint(0);
        hit.classList.add('eco-webgl-ready');
        run();
      }).catch(function(e){
        if(window.console)console.warn('Eco Club Earth: CSS fallback enabled',e);
      });
    }catch(e){
      if(window.console)console.warn('Eco Club Earth: CSS fallback enabled',e);
    }finally{busy=false;}
  }
  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        inView=entry.isIntersecting;
        if(inView){initialize();run();}
        else if(raf){cancelAnimationFrame(raf);raf=0;}
      });
    },{rootMargin:'400px 0px 400px 0px'});
    observer.observe(hit);
  }else{inView=true;initialize();}
  document.addEventListener('visibilitychange',function(){
    if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}
    else run();
  });
  window.addEventListener('resize',function(){if(ready){resize();if(lowMotion)paint(0)}},{passive:true});
  canvas.addEventListener('webglcontextlost',function(e){
    e.preventDefault();ready=false;hit.classList.remove('eco-webgl-ready');
    if(raf){cancelAnimationFrame(raf);raf=0;}
  });
})();
