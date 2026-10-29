import{n as e,s as t}from"./rolldown-runtime-DvfoX5Ak.js";import{r as n,t as r}from"./global-scene-DsfKuIp6.js";import{t as i}from"./phaser-HvtALT2i.js";var a,o,InkGradePostFX;function init_ink_grade(){return(init_ink_grade=e((()=>{a=t(i(),1),o=`
#define SHADER_NAME INK_GRADE_FS
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;
varying vec2 outTexCoord;
const float uSat = 1.10;
const float uVib = 0.22;
const float uContrast = 1.08;
const vec3 uShadowTint = vec3(0.965, 0.99, 1.045);
const vec3 uHighTint = vec3(1.03, 1.0, 0.965);
const float uVignette = 0.24;
void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  float chroma = (mx - mn) / max(mx, 1e-4);
  c.rgb = max(mix(vec3(l), c.rgb, uSat + uVib * (1.0 - smoothstep(0.1, 0.7, chroma))), 0.0);
  c.rgb = 0.18 * pow(max(c.rgb, vec3(1e-6)) / 0.18, vec3(uContrast));
  float lt = smoothstep(0.015, 0.55, l);
  c.rgb *= mix(vec3(1.0), mix(uShadowTint, uHighTint, lt), 1.0 - 0.85 * smoothstep(0.35, 0.8, chroma));
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 q = (outTexCoord - 0.5) * vec2(aspect, 1.0);
  float r = length(q);
  c.rgb *= 1.0 - uVignette * smoothstep(0.55, 1.25, r);
  gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), c.a);
}`,InkGradePostFX=class extends a.default.Renderer.WebGL.Pipelines.PostFXPipeline{constructor(e){super({game:e,name:`InkGradePostFX`,fragShader:o})}onPreRender(){this.set2f(`uResolution`,this.renderer.width,this.renderer.height)}}})))()}function makeSplatTexture(e,t){let n=r.make.graphics({x:0,y:0},!1),i=t,rnd=()=>(i=i*16807%2147483647)/2147483647;n.fillStyle(16777215,1),n.fillCircle(16,16,7+rnd()*2);for(let e=0;e<7;e++){let e=rnd()*Math.PI*2,t=6+rnd()*8;n.fillCircle(16+Math.cos(e)*t,16+Math.sin(e)*t,1.5+rnd()*3)}n.generateTexture(e,32,32),n.destroy()}function initAgentFx(){if(c)return;c=!0;for(let e=0;e<4;e++)makeSplatTexture(`ink_splat_${e}`,1234+e*977);let e=r.renderer;if(e?.pipelines){e.pipelines.addPostPipeline(`InkGradePostFX`,InkGradePostFX);let t=r.cameras.main;t.setPostPipeline(InkGradePostFX);try{t.postFX?.addBloom(16777215,1,1,.8,.35,4)}catch{}}}function inkHit(e,t=0,n=!1){try{initAgentFx();let i=e.getSprite();if(!i)return;let a=i.getWorldTransformMatrix(),o=a.tx,c=a.ty-i.displayHeight*.45,l=s[t]??16777215,u=r.field?.scale||6,d=n?14:8;for(let e=0;e<d;e++){let t=`ink_splat_${e%4}`,i=r.add.image(o,c,t).setTint(l).setDepth(1e3).setScale(.1*u);i.setRotation(Math.random()*Math.PI*2);let a=Math.random()*Math.PI*2,s=((n?22:15)+Math.random()*12)*(u/6)*6;r.tweens.add({targets:i,x:o+Math.cos(a)*s,y:c+Math.sin(a)*s*.7+u,scale:(.18+Math.random()*(n?.3:.18))*u,duration:220,ease:`Cubic.easeOut`,onComplete:()=>r.tweens.add({targets:i,alpha:0,y:i.y+3*u,scaleY:i.scaleY*1.3,duration:520,delay:160,ease:`Quad.easeIn`,onComplete:()=>i.destroy()})})}let f=i.scaleX,p=i.scaleY;r.tweens.add({targets:i,scaleX:f*1.12,scaleY:p*.88,duration:70,yoyo:!0,ease:`Quad.easeOut`,onComplete:()=>i.setScale(f,p)}),r.cameras.main.shake(n?160:90,n?.006:.003)}catch(e){console.warn(`inkHit`,e)}}var s,c;function init_agent_fx(){return(init_agent_fx=e((()=>{n(),init_ink_grade(),s=[14209728,16734762,3843839,5231715,16767290,9433343,16729190,12606719,14263130,10470399,16732078,11067450,11901546,8019199,5926143,5917286,12110040,16752608],c=!1})))()}export{init_agent_fx as n,inkHit as r,initAgentFx as t};
//# sourceMappingURL=agent-fx-CyG7XMHl.js.map