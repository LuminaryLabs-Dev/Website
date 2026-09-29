/* Bounded screen-space glow for the fractal collection: one texture and one pass. */
window.createLibraryBloomPass=function(gl){
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(e);}return shader;};
  const vs=compile(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}');
  const fs=compile(gl.FRAGMENT_SHADER,`precision mediump float;uniform sampler2D source;uniform vec2 pixel;varying vec2 uv;
  vec3 bright(vec2 offset){vec3 c=texture2D(source,uv+offset*pixel).rgb;return c*smoothstep(.40,.95,max(c.r,max(c.g,c.b)));}
  void main(){vec3 c=texture2D(source,uv).rgb;vec3 bloom=vec3(0.);for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 d=vec2(cos(a),sin(a));bloom+=bright(d*3.)*.055+bright(d*9.)*.030+bright(d*20.)*.014;}gl_FragColor=vec4(c+bloom*.65,1.);}`);
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const tex=gl.createTexture(),position=gl.getAttribLocation(program,'p'),pixel=gl.getUniformLocation(program,'pixel'),sampler=gl.getUniformLocation(program,'source');let w=0,h=0;
  gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return {render(time,width,height){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);if(w!==width||h!==height){gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGB,0,0,width,height,0);w=width;h=height;}else gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,height);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);gl.uniform1i(sampler,0);gl.uniform2f(pixel,1/width,1/height);gl.drawArrays(gl.TRIANGLES,0,6);gl.bindTexture(gl.TEXTURE_2D,null);},dispose(){gl.deleteTexture(tex);gl.deleteBuffer(buffer);gl.deleteProgram(program);}};
};
