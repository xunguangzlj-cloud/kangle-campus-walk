(async()=>{
const {MATERIAL_FIELDS,TREE_SKINS,LIVE_FIELDS,FROND_DATA,AVENUE_TRUNKS,CANOPY_FIELDS,BRICK_FIELD,STATUE_MESH,STATUE_DISTANT}=await window.campusWeb.data;
const COURT_MAPS=window.campusWeb.preview,COURT_GI=true;
// 只给可碰到的构件建立简化实体。台阶、台座和屋檐有各自的上下界，镜头与角色共用这组数据。
function buildWalkSpace(T,components,treeBatches,layout){
  const cells=new Map(),cell=5,ground=.017;
  function add(x,z,w,d,b,t,round=false){
    const shape={x,z,w:w/2,d:d/2,b,t,round};
    for(let i=Math.floor((x-w/2)/cell);i<=Math.floor((x+w/2)/cell);i++)
      for(let j=Math.floor((z-d/2)/cell);j<=Math.floor((z+d/2)/cell);j++){
        const key=i+':'+j;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(shape);
      }
  }
  const post=(x,z,r,b,t)=>add(x,z,r*2,r*2,b,t,true);
  const hall=layout.hall[1],pz=layout.pavilion[1],sz=layout.statue[1];
  add(0,hall,22,10.9,0,1.44);add(0,hall-.97,6.09,8.56,1.43,7.12);
  add(0,hall+3.60,1.95,.74,1.43,5.12);
  for(const s of [-1,1]){
    add(s*7.07,hall,8.25,10.65,1.43,7.35);add(s*5.35,hall+3.34,4.85,6.54,0,11.1);
    add(s*1.48,hall+6.36,.72,.80,1.44,7.6);
  }
  add(0,hall+4.99,6.2,3.46,0,1.54);add(0,hall+5.1,6.6,3.8,6.96,8);
  for(let i=0;i<8;i++)add(0,hall+6.7+i*.34,3.1,.38,0,(8-i)*.19);
  for(const [i,w,d] of [[1,6.4,12],[2,6,12.8],[3,6.5,14],[4,5.8,9.4],[5,10.4,6.5]]){
    const {x,z}=components['lodge'+i].position;add(x,z,w+.65,d+.65,0,8.6);
  }
  add(0,sz,5,3.2,0,.966);add(0,sz,1.65,1.65,.96,4.75);
  for(const s of [-1,1]){
    add(0,sz+s*1.5,4.88,.24,.96,1.77);
    for(let i=0;i<5;i++)add(s*(2.55+i*.26),sz,.3,2.7,0,(5-i)*.18);
    for(const v of [-1,1])add(s*3.01,sz+v*1.46,1.5,.19,0,1.44);
  }
  add(0,pz,9.8,8.3,0,.77);
  for(const s of [-1,1]){
    add(s*4.65,pz,.26,8.0,.77,1.68);add(s*5.08,pz,.70,8.7,0,.79);
    for(const t of [-1,1]){
      add(s*2.88,pz+t*3.96,3.76,.29,.77,1.68);
      add(s*3.23,pz+t*4.4,3.86,.69,0,.78);
    }
    for(let i=0;i<4;i++)add(0,pz+s*(4.23+i*.34),2.2,.38,0,(4-i)*.19);
  }
  for(let j=0;j<8;j++){const a=j*Math.PI/4+Math.PI/8;post(2.28*Math.cos(a),pz+2.28*Math.sin(a),.175,.77,4.18)}
  post(0,pz,.75,2.02,3.22);add(0,pz,5.6,5.6,4.02,6.5);
  for(const b of treeBatches)for(const t of b.instances)post(t.x,t.z,t.scale*(b.far.length?.51:.31),0,6*t.scale);
  for(const s of [-1,1]){
    for(const z of [-17,-5,8,21,32]){post(s*14.6,z,.17,0,4.3);add(s*12.9,z+1.7,.68,1.94,0,1.08)}
    add(s*9.05,18.6,5.4,1.9,0,.97);
    for(const [x,z,r] of [[5.8,19,1.05],[5.65,34.8,1.4],[8.6,-20.6,.85]])post(s*x,z,r*.82,0,r);
  }
  // 校园可行走范围与总览相机的浏览范围一致。
  add(-34,0,1,98,-2,30);add(34,0,1,98,-2,30);add(0,-48,70,1,-2,30);add(0,48,70,1,-2,30);
  if(COURT){
    add(-16,-20,1,38,-2,30);add(16,-20,1,38,-2,30);add(0,-38,33,1,-2,30);add(0,-2,33,1,-2,30);
    add(0,hall+3.74,6.04,.28,1.45,4.70);
    for(const s of [-1,1])for(let i=0;i<8;i++)add(s*1.89,hall+6.7+i*.34,.60,.35,0,(8-i)*.19+.40);
  }
  function each(x,z,r,fn){
    const seen=new Set();
    for(let i=Math.floor((x-r)/cell);i<=Math.floor((x+r)/cell);i++)
      for(let j=Math.floor((z-r)/cell);j<=Math.floor((z+r)/cell);j++)
        for(const o of cells.get(i+':'+j)||[]){if(seen.has(o))continue;seen.add(o);
          const dx=Math.abs(x-o.x),dz=Math.abs(z-o.z);
          if(o.round?dx*dx+dz*dz<(o.w+r)**2:Math.hypot(Math.max(0,dx-o.w),Math.max(0,dz-o.d))<r)fn(o);
        }
  }
  function support(x,z,limit,r=.10){let best=null;each(x,z,r,o=>{if(o.t<=limit&&(!best||o.t>best.t))best=o});return best}
  function floor(x,z,limit,r){return Math.max(ground,support(x,z,limit,r)?.t??ground)}
  function blocked(x,z,low,high,r){let hit=false;each(x,z,r,o=>{if(o.b<high-.004&&o.t>low+.004)hit=true});return hit}
  function ceiling(x,z,top,next){let y=next;each(x,z,.32,o=>{if(o.b>=top-.004&&o.b<=y)y=o.b-.005});return y}
  function cameraDistance(p,dir,length){
    const steps=Math.ceil(length/.11);
    for(let j=1;j<=steps;j++){const l=length*j/steps,x=p.x+dir.x*l,y=p.y+dir.y*l,z=p.z+dir.z*l;
      if(y<ground+.17||blocked(x,z,y-.14,y+.14,.16))return Math.max(.015,length*(j-1)/steps);
    }return length;
  }
  return {floor,support,blocked,ceiling,cameraDistance};
}

function makeWalker({T,scene,camera,controls,renderer,components,treeBatches,LAYOUT,reset,entering,redraw}){
  const by=id=>document.getElementById(id),button=by('actorButton'),can=renderer.domElement;
  const space=buildWalkSpace(T,components,treeBatches,LAYOUT),held=new Set(),stick=new T.Vector2();
  const p=new T.Vector3(.25,.017,COURT?-5.4:10.4),vel=new T.Vector2(),look=new T.Vector3(),dir=new T.Vector3(),pivot=new T.Vector3();
  const R=.43,H=1.70,clamp=T.MathUtils.clamp,actions=new Map();
  let mode=0,request=0,resource,root,model,shade,mixer,motion='',vertical=0,grounded=true,groundY=.017;
  let yaw=0,pitch=.06,heading=-2.13,distance=4.35,arm=distance,grace=0,buffer=0,land=0,last=0,drag=null,joyId=null;
  let pivotY=1.25,shadowTime=0,cast,stamp,walkPhase=0,turnLean=0,hairLift=0,orbitSide=1.04,orbitOffset=0,orbitDrag=false,entryRatio=1;
  let travel=0,turnAmount=0,showFull=null,stepBias=0,soleShift=0;
  const skirt=[],detailMeshes=[],actorMaterials=new Map();
  const candidate=new T.Vector3();
  const hair=[],limbs=[],boneQ=new T.Quaternion(),spinAxis=new T.Vector3(),spin=new T.Quaternion(),footL=new T.Vector3(),footR=new T.Vector3();
  const shoulder=new T.Vector3(),fromElbow=new T.Vector3(),toElbow=new T.Vector3(),liftArm=new T.Quaternion();
  const hip=new T.Vector3(),knee=new T.Vector3(),ankle=new T.Vector3(),kneeGoal=new T.Vector3(),legAxis=new T.Vector3(),bendDir=new T.Vector3(),legs=[];
  const ankleTurns=[],upAxis=new T.Vector3(0,1,0),restFoot=new T.Quaternion();
  const penumbra={value:1.2};
  const clipGround={value:new T.Vector4(-100,-100,100,100)};
  let leftFoot,rightFoot,legSwing=0,hop=0,nearWall=0;
  const footprints=[],contacts=[new T.Vector3(),new T.Vector3()];
  const soles=[],solePoint=new T.Vector3(),soleGaps=[0,0],soleContacts=[new T.Vector3(),new T.Vector3()];
  const hintD=document.querySelector('.hint .desktop'),hintM=document.querySelector('.hint .mobile'),oldText=[hintD.textContent,hintM.textContent];
  function clear(){held.clear();stick.set(0,0);by('joy').firstElementChild.style.transform='';drag=null;joyId=null;buffer=0;vel.set(0,0);last=0}
  function label(){
    const text=mode===1?'第一人称':'第三人称';button.textContent=mode?(mode===1?'切到第三人称':'切到第一人称'):'人物漫游';
    button.title=mode?'原地切换视角（V）':'进入人物漫游（V）';by('walkExit').hidden=!mode;
    document.querySelector('.stage').classList.toggle('walking',!!mode);
    if(mode)by('viewName').textContent=text;
    hintD.textContent=mode?'WASD 移动 · Shift 跑 · 空格跳 · V 换视角':oldText[0];
    hintM.textContent=mode?'摇杆移动 · 拖动转头':oldText[1];
  }
  const onlineMeshes=new Map();
  let upgrading=false,finishedDetail=false,nextAttempt=0,detailAfter=Infinity;
  async function upgradeCharacter(){
    if(upgrading||finishedDetail||performance.now()<nextAttempt)return;
    upgrading=true;
    try{
      const {buffer,decoder}=await window.campusWeb.character(null,true);
      const hi=await new CampusTools.GLTFLoader().setMeshoptDecoder(decoder).parseAsync(buffer,'');
      const changes=[];
      hi.scene.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const object=onlineMeshes.get(hi.parser.associations.get(mesh)?.meshes);
        if(object)changes.push(hi.parser.getDependency('accessor',mesh.userData.walkIndex).then(low=>({object,mesh,low})));
      });
      const replacements=await Promise.all(changes),materials=new Set(),textures=new Set();
      // 保留正在播放的骨架、混合器和脚底采样。只替换可绘制的几何与表面。
      detailMeshes.length=0;actorMaterials.clear();
      for(const {object,mesh,low} of replacements){
        materials.add(object.material);object.geometry.dispose();
        const full=mesh.geometry.index;object.geometry=mesh.geometry;object.material=mesh.material;
        object.geometry.setIndex(showFull?full:low);detailMeshes.push({mesh:object,full,low});
        if(COURT)actorMaterials.set(object.material,object.material.color.clone());
      }
      for(const m of materials){for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose()}
      for(const texture of textures){texture.dispose();texture.image?.close?.()}
      finishedDetail=true;onlineMeshes.clear();redraw();
    }catch{nextAttempt=performance.now()+60000}finally{upgrading=false}
  }
  async function load(){
    const loader=new CampusTools.GLTFLoader();let data;
    if(window.campusWeb){
      const result=await window.campusWeb.character(n=>{button.textContent='载入人物 '+n+'%'});
      loader.setMeshoptDecoder(result.decoder);data=result.buffer;
    }else{
      const bytes=unpackBytes(by('actorData').textContent);
      data=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    }
    const gltf=await loader.parseAsync(data,'');
    model=gltf.scene;const bounds=new T.Box3().setFromObject(model,true),scale=1.66/(bounds.max.y-bounds.min.y);
    model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;model.rotation.y=Math.PI/2;
    const indices=[];
    model.traverse(o=>{
      if(o.isMesh){o.frustumCulled=false;o.receiveShadow=true;o.layers.enable(5);if(COURT&&!actorMaterials.has(o.material))actorMaterials.set(o.material,o.material.color.clone())}
      const id=gltf.parser.associations.get(o)?.meshes;
      if(window.campusWeb&&o.isMesh)onlineMeshes.set(id,o);
      if(id===39||id===41){
        // 原角色左右鞋底的独立网格，分别取鞋尖、鞋跟与两侧最低的一圈顶点。
        const attr=o.geometry.attributes.position,ids=[];
        for(let k=0;k<8;k++){
          let best=-Infinity,index=0;const a=k*Math.PI/4;
          for(let j=0;j<attr.count;j++){if(attr.getY(j)>.0032)continue;
            const score=attr.getX(j)*Math.cos(a)+attr.getZ(j)*Math.sin(a);if(score>best){best=score;index=j}}
          if(!ids.includes(index))ids.push(index);
        }
        soles.push({mesh:o,ids});
      }
      if(o.isMesh&&Number.isInteger(o.userData.walkIndex)){
        indices.push(gltf.parser.getDependency('accessor',o.userData.walkIndex).then(low=>detailMeshes.push({mesh:o,full:o.geometry.index,low})));
      }
      if(o.isBone&&/^Skirt_0[1-8]_0[123]$/.test(o.name))skirt.push({bone:o,level:Number(o.name.slice(-1)),delta:new T.Vector3()});
      if(o.isBone&&/^Hair_0[1-6]_0[123]$/.test(o.name))hair.push({bone:o,delta:new T.Quaternion(),weight:o.name.endsWith('01')?.27:o.name.endsWith('03')?.61:.94});
      if(o.isBone&&/^[LR]_(Thigh|Calf|Upperarm|Forearm)$/.test(o.name))limbs.push({bone:o,type:o.name.split('_')[1],side:o.name.startsWith('L')?1:-1,delta:new T.Quaternion()});
      if(o.name==='L_Foot')leftFoot=o;if(o.name==='R_Foot')rightFoot=o;
    });
    for(const l of limbs){
      const end={Upperarm:'Forearm',Forearm:'Hand',Thigh:'Calf',Calf:'Foot'}[l.type];
      l.tip=model.getObjectByName((l.side>0?'L':'R')+'_'+end);
    }
    for(const side of [1,-1])legs.push(['Thigh','Calf'].map(type=>limbs.find(l=>l.type===type&&l.side===side)));
    await Promise.all(indices);
    root=new T.Group();root.name='可操纵人物';root.rotation.order='YXZ';root.add(model);root.visible=false;scene.add(root);components.player=root;
    for(const bone of [leftFoot,rightFoot])ankleTurns.push({bone,rest:bone.getWorldQuaternion(new T.Quaternion()),delta:new T.Quaternion()});
    const c=document.createElement('canvas');c.width=c.height=96;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(48,48,2,48,48,46);
    g.addColorStop(0,'rgba(36,28,22,.53)');g.addColorStop(.55,'rgba(36,28,22,.25)');g.addColorStop(1,'rgba(36,28,22,0)');ctx.fillStyle=g;ctx.fillRect(0,0,96,96);
    shade=new T.Mesh(new T.PlaneGeometry(1.12,.83),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    shade.rotation.x=-Math.PI/2;shade.visible=false;scene.add(shade);
    for(let i=0;i<2;i++){
      const mark=shade.clone();mark.material=shade.material.clone();mark.scale.set(COURT?.33:.22,COURT?.47:.36,1);if(COURT)mark.material.color.setHex(0x59432e);
      scene.add(mark);footprints.push(mark);
    }
    // 只重绘骨骼角色的太阳投影，沿用校园静态阴影。近处每秒更新十二次。
    const rt=new T.WebGLRenderTarget(192,192),sunCam=new T.OrthographicCamera(-2.4,2.4,2.4,-2.4,.1,20);
    sunCam.layers.set(5);sunCam.up.set(0,0,-1);
    const floorUniform={value:0},lightDir={value:new T.Vector2(.786,-.375)},ink=new T.MeshBasicMaterial({color:0x35412d,side:T.DoubleSide,depthTest:false,depthWrite:false});
    ink.onBeforeCompile=s=>{
      s.uniforms.castFloor=floorUniform;s.uniforms.castDirection=lightDir;
      s.vertexShader='uniform float castFloor;uniform vec2 castDirection;\n'+s.vertexShader.replace('#include <project_vertex>',
        'vec4 wp=modelMatrix*vec4(transformed,1.);wp.xz+=(wp.y-castFloor)*castDirection;wp.y=castFloor;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;');
    };
    cast=new T.Mesh(new T.PlaneGeometry(4.8,4.8),new T.MeshBasicMaterial({map:rt.texture,transparent:true,opacity:.37,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
    cast.material.onBeforeCompile=s=>{s.uniforms.walkSupport=clipGround;s.uniforms.penumbra=penumbra;
      s.vertexShader='varying vec2 floorXZ;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloorXZ=(modelMatrix*vec4(position,1.)).xz;');
      s.fragmentShader='varying vec2 floorXZ;uniform vec4 walkSupport;\n'+s.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(any(lessThan(floorXZ,walkSupport.xy))||any(greaterThan(floorXZ,walkSupport.zw)))discard;');
    };
    if(COURT){
      const projectShadow=cast.material.onBeforeCompile;
      cast.material.onBeforeCompile=s=>{
        projectShadow(s);
        s.fragmentShader='uniform float penumbra;\n'+s.fragmentShader.replace('#include <map_fragment>',`
          float softness=0.;
          for(int j=0;j<13;j++){float a=float(j)*2.39996,r=sqrt((float(j)+.4)/13.)*penumbra/192.;
            softness+=texture2D(map,vMapUv+vec2(cos(a),sin(a))*r).a;}
          diffuseColor.a*=softness/13.;diffuseColor.rgb*=vec3(.010,.014,.009);
        `);
      };
    }
    cast.rotation.x=-Math.PI/2;cast.visible=false;scene.add(cast);
    const light=scene.children.find(o=>o.isDirectionalLight),savedColor=new T.Color();
    stamp=()=>{
      const old=renderer.getRenderTarget(),bg=scene.background,override=scene.overrideMaterial,alpha=renderer.getClearAlpha();
      renderer.getClearColor(savedColor);floorUniform.value=groundY;
      const aim=light.target.position;lightDir.value.set((aim.x-light.position.x)/(light.position.y-aim.y),(aim.z-light.position.z)/(light.position.y-aim.y));
      sunCam.position.set(p.x,groundY+10,p.z);sunCam.lookAt(p.x,groundY,p.z);
      scene.overrideMaterial=ink;scene.background=null;renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.render(scene,sunCam);
      renderer.setRenderTarget(old);renderer.setClearColor(savedColor,alpha);scene.background=bg;scene.overrideMaterial=override;
    };
    mixer=new T.AnimationMixer(model);for(const clip of gltf.animations)actions.set(clip.name,mixer.clipAction(clip));
    for(const name of ['jump','land']){const a=actions.get(name);a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true}
    actions.get('wait').play();motion='wait';mixer.update(0);
  }
  async function switchMode(){
    if(mode){mode=3-mode;arm=distance;shadowTime=.2;label();sync(0);can.focus({preventScroll:true});return}
    const token=++request;button.disabled=true;button.textContent='载入人物…';
    try{
      if(!resource)resource=load().catch(e=>{resource=null;throw e});await resource;if(token!==request)return;
      entryRatio=renderer.getPixelRatio();entering();controls.enabled=false;mode=2;detailAfter=performance.now()+6000;arm=distance;shadowTime=.2;clear();label();sync(0);can.focus({preventScroll:true});
    }catch(err){console.error(err);button.textContent='重试载入人物';by('detail').textContent='人物未能载入，点击按钮可重试。'}
    finally{button.disabled=false}
  }
  function leave(home){
    ++request;if(!mode){if(button.disabled&&resource)label();return}mode=0;clear();root.visible=shade.visible=cast.visible=false;for(const mark of footprints)mark.visible=false;
    if(renderer.getPixelRatio()!==entryRatio)renderer.setPixelRatio(entryRatio);controls.enabled=true;label();camera.fov=camera.aspect<.85?55:44;camera.updateProjectionMatrix();if(home)reset();redraw();
  }
  function fov(){return mode===1?72:Math.max(57,Math.min(100,2*Math.atan(1.49/Math.max(.72,arm))*180/Math.PI))}
  function sync(dt){
    root.position.copy(p);root.position.y+=soleShift;root.rotation.y=heading;root.visible=mode===2;
    if(COURT&&courtIrradiance){
      // 屋顶遮光使用建筑烘焙体的零阶能见度。光照计算在线性颜色空间内完成。
      const field=courtIrradiance.image.data;
      const u=(p.x+13)/26*116-.5,v=(p.y+1.30+.3)/15*72-.5,w=(p.z+35)/19*82-.5;
      let visibility=1;
      if(u>=0&&v>=0&&w>=0&&u<115&&v<71&&w<81){
        visibility=0;
        for(let k=0;k<8;k++){
          const dx=k&1,dy=k>>1&1,dz=k>>2;
          const weight=(dx?u%1:1-u%1)*(dy?v%1:1-v%1)*(dz?w%1:1-w%1);
          visibility+=weight*field[4*(Math.floor(u)+dx+116*(Math.floor(v)+dy+72*(Math.floor(w)+dz)))]/255;
        }
        visibility=clamp((visibility-.20)/.57,.15,1);
      }
      const gain=.043+.957*visibility*visibility;
      for(const [m,original] of actorMaterials)m.color.copy(original).multiplyScalar(gain);
      cast.material.opacity=.37*visibility;
    }
    shade.visible=mode===2;shade.position.set(p.x,groundY+.016,p.z);shade.material.opacity=1-clamp((p.y-groundY)*.48,0,.65);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch);
    dir.set(-sy*cp,Math.sin(pitch),-cy*cp);
    if(mode===1){camera.position.copy(p);camera.position.y+=1.52;camera.lookAt(look.copy(camera.position).add(dir))}
    else{
      const ahead=space.blocked(p.x-sy*.87,p.z-cy*.87,p.y+.72,p.y+1.58,.28);
      nearWall=dt?T.MathUtils.damp(nearWall,ahead?1:0,9,dt):Number(ahead);
      const stairs=grounded&&p.y>.12&&p.y<1.53&&Math.abs(p.x)<1.8&&p.z<-16;
      stepBias=dt?T.MathUtils.damp(stepBias,stairs?1:0,10,dt):Number(stairs);
      const moving=clamp(travel/3.65,0,1);
      const nextY=groundY+1.17+(p.y-groundY)*.22-nearWall*.16-stepBias*.31-moving*.10;
      pivotY=dt?T.MathUtils.damp(pivotY,nextY,17,dt):nextY;
      pivot.set(p.x,pivotY,p.z);
      // 从斜后方留出手脚的剪影，腾空时镜头仅跟随部分高度。
      const a=clamp(.18-pitch+nearWall*.08+stepBias*(COURT?.095:-.10)-moving*.09,-.60,1.24);
      const ideal=T.MathUtils.lerp(1.04+.29*Math.min(1,vel.length()/3.55)-stepBias*(COURT?.56:.04),-1.06,nearWall)+orbitOffset;
      const boom=distance*(1-.22*nearWall-.09*moving);
      const aimSide=off=>candidate.set(Math.sin(yaw+off)*Math.cos(a),Math.sin(a),Math.cos(yaw+off)*Math.cos(a));
      let choice=ideal,score=-Infinity;
      // 门柱挡住常用机位时，在两柱之间寻找可容纳全身的镜头位置，再决定是否缩臂。
      for(const off of [ideal,.20,-.20,0,-.42,.42,-.84,.84,1.30,-1.30,1.60,-1.60]){
        const v=aimSide(off),r=space.cameraDistance(pivot,v,boom);
        let value=r-.72*Math.abs(off-ideal)-.12*Math.abs(off-orbitSide);
        if(nearWall>.4){
          // 检查近景画幅的两边，防止镜头中心穿过柱间、画面边缘却被近柱占满。
          for(const depth of [.55,1.05])for(const side of [-1,1]){
            const width=side*depth*.81,x=pivot.x+v.x*(r-depth)+Math.cos(yaw+off)*width,z=pivot.z+v.z*(r-depth)-Math.sin(yaw+off)*width;
            const y=pivot.y+v.y*(r-depth);if(space.blocked(x,z,y-.33,y+.33,.15))value-=.82;
          }
        }
        if(value>score){score=value;choice=off}if(off===ideal&&r>=boom-.02&&nearWall<=.4)break;
      }
      orbitSide=dt?T.MathUtils.damp(orbitSide,choice,12,dt):choice;
      let reach=space.cameraDistance(pivot,aimSide(orbitSide),boom);
      if(reach<1.85){const alt=space.cameraDistance(pivot,aimSide(choice),boom);if(alt>reach+.35){orbitSide=choice;reach=alt}}
      dir.copy(aimSide(orbitSide));
      arm=reach<arm||!dt?reach:T.MathUtils.damp(arm,reach,11,dt);
      camera.position.copy(pivot).addScaledVector(dir,arm);root.visible=arm>.82;
      const full=arm<(showFull?2.65:2.45);
      if(window.campusWeb&&!finishedDetail&&!upgrading&&(full||(!navigator.connection?.saveData&&performance.now()>detailAfter)))upgradeCharacter();
      if(full!==showFull){for(const item of detailMeshes)item.mesh.geometry.setIndex(full?item.full:item.low);showFull=full}
      look.copy(pivot);const lead=Math.min(.85,arm*.19);look.x-=sy*lead;look.z-=cy*lead;
      const tight=Math.max(nearWall,stepBias,clamp((3.9-arm)/1.6,0,1));
      look.y=T.MathUtils.lerp(pivot.y+.20,p.y+.87+soleShift,tight);camera.lookAt(look);
    }
    if(camera.fov!==fov()){camera.fov=fov();camera.updateProjectionMatrix()}
    cast.visible=mode===2&&root.visible;
    for(const [i,foot] of [leftFoot,rightFoot].entries()){
      const mark=footprints[i];mark.visible=cast.visible&&grounded;if(!mark.visible)continue;
      foot.getWorldPosition(contacts[i]);const v=contacts[i],top=space.floor(v.x,v.z,p.y+.23);
      if(COURT&&mode===2&&soles.length===2){
        const q=soleContacts[i],y=space.floor(q.x,q.z,p.y+.29,.004);
        mark.position.set(q.x,y+.008,q.z);mark.material.opacity=clamp(1.3-soleGaps[i]*7.5,0,1);
        mark.renderOrder=3;
      }else{mark.position.set(v.x,top+.011,v.z);mark.material.opacity=clamp(1.65-(v.y-top)*5.4,0,1)}
      mark.rotation.z=-heading;
    }
    if(cast.visible){
      const platform=groundY>.11?space.support(p.x,p.z,groundY+.01):null;
      if(platform)clipGround.value.set(platform.x-platform.w,platform.z-platform.d,platform.x+platform.w,platform.z+platform.d);
      else clipGround.value.set(-100,-100,100,100);
      penumbra.value=1.05+4.8*Math.max(0,p.y-groundY);cast.position.set(p.x,groundY+.018,p.z);shadowTime+=dt;
      if(shadowTime>=1/12){stamp();shadowTime=0}
    }
  }
  function move(axis,delta){
    if(!delta)return;const x=p.x+(axis==='x'?delta:0),z=p.z+(axis==='z'?delta:0);
    const limit=p.y+(grounded?.223:.004),step=space.floor(x,z,limit);
    const base=Math.max(p.y,grounded?step:p.y);
    if(!space.blocked(x,z,base+.40,base+H,R)&&!space.blocked(x,z,base,base+.41,.10)){p[axis]+=delta;if(grounded&&step>p.y)p.y=step}
  }
  function advance(dt){
    const key=(a,b)=>held.has(a)||held.has(b)?1:0;
    let side=key('KeyD','ArrowRight')-key('KeyA','ArrowLeft')+stick.x;
    let forward=key('KeyW','ArrowUp')-key('KeyS','ArrowDown')-stick.y;
    const amp=Math.hypot(side,forward);if(amp>1){side/=amp;forward/=amp}
    const sprint=held.has('ShiftLeft')||held.has('ShiftRight')||stick.length()>.86,speed=sprint?3.65:1.55;
    const tx=(Math.cos(yaw)*side-Math.sin(yaw)*forward)*speed,tz=(-Math.sin(yaw)*side-Math.cos(yaw)*forward)*speed;
    const dx=tx-vel.x,dz=tz-vel.y,rate=grounded?(amp>.01?15:22):6;
    const k=Math.min(1,rate*dt/Math.max(.0001,Math.hypot(dx,dz)));vel.x+=dx*k;vel.y+=dz*k;
    grace=grounded?.1:Math.max(0,grace-dt);buffer=Math.max(0,buffer-dt);
    if(buffer&&grace){vertical=4.65;grounded=false;grace=buffer=0;land=0}
    const bx=p.x,bz=p.z;
    move('x',vel.x*dt);move('z',vel.y*dt);
    const actual=Math.hypot(p.x-bx,p.z-bz)/dt;
    let turn=0;
    if(actual>.06){const target=Math.atan2(bx-p.x,bz-p.z);turn=Math.atan2(Math.sin(target-heading),Math.cos(target-heading));heading+=turn*(1-Math.exp(-17*dt))}
    const was=grounded;groundY=space.floor(p.x,p.z,p.y+.015);
    if(grounded&&groundY<p.y-.226)grounded=false;
    if(grounded)p.y=groundY;
    else{
      vertical-=13.6*dt;let y=p.y+vertical*dt;
      if(vertical>0){const top=space.ceiling(p.x,p.z,p.y+H,y+H);if(top<y+H-.001){y=top-H;vertical=0}}
      if(vertical<=0&&y<=groundY+.005){y=groundY;grounded=true;vertical=0;if(!was)land=.14}
      p.y=Math.max(ground,y);
    }
    land=Math.max(0,land-dt);
    const name=!grounded?(vertical>0?'jump':'fall_air'):land>0?'land':actual>2.65?'run':actual>.15?'walk':'wait';
    if(motion!==name){
      const next=actions.get(name),old=actions.get(motion),phase=old.time/old.getClip().duration;
      next.reset().play();if(['run','walk'].includes(name)&&['run','walk'].includes(motion))next.time=(phase%1)*next.getClip().duration;
      old.crossFadeTo(next,name==='jump'?.075:.14,false);motion=name;
    }
    if(name==='walk'||name==='run')actions.get(name).timeScale=clamp(actual/(name==='run'?3.04:1.48),.65,1.32);
    travel=actual;turnAmount=turn;
  }
  function pose(dt){
    const actual=travel,turn=turnAmount;
    root.position.copy(p);
    for(const h of hair)h.bone.quaternion.multiply(h.delta.invert());
    for(const l of limbs)l.bone.quaternion.multiply(l.delta.invert());
    for(const foot of ankleTurns){foot.bone.quaternion.multiply(foot.delta.invert());foot.delta.identity()}
    for(const s of skirt)s.bone.position.sub(s.delta);
    mixer.update(dt);
    if(!by('enhanceMotion').checked){
      for(const b of [...hair,...limbs])b.delta.identity();
      for(const s of skirt)s.delta.set(0,0,0);
      model.rotation.y=Math.PI/2;model.rotation.z=root.rotation.x=root.rotation.z=soleShift=0;return;
    }
    model.rotation.y=Math.PI/2+nearWall*.77*(1-Math.min(1,actual));
    walkPhase+=actual*dt*4.25;turnLean=T.MathUtils.damp(turnLean,clamp(turn*actual*.055,-.17,.17),11,dt);
    hairLift=T.MathUtils.damp(hairLift,clamp(actual*.21+Math.max(0,-vertical)*.087,0,.97),8,dt);
    model.rotation.z=turnLean;root.rotation.y=heading;
    const forwardLean=grounded?-.235*Math.min(actual/3.65,1):.15;
    root.rotation.x=T.MathUtils.damp(root.rotation.x,forwardLean,13,dt);
    root.rotation.z=T.MathUtils.damp(root.rotation.z,grounded?0:.195,12,dt);
    root.updateMatrixWorld(true);
    // 跟随原片段的支撑脚相位放大摆幅；起跳后屈膝，着地前展开，手臂随之配平。
    leftFoot.getWorldPosition(footL);rightFoot.getWorldPosition(footR);
    const forwardGap=(footR.x-footL.x)*Math.sin(heading)+(footR.z-footL.z)*Math.cos(heading);
    legSwing=T.MathUtils.damp(legSwing,clamp(forwardGap*3.3,-1,1)*(grounded?Math.min(1,actual/3.1):0),24,dt);
    hop=T.MathUtils.damp(hop,grounded?0:clamp((p.y-groundY)*2.8+.16,0,1),grounded?20:16,dt);
    // 裙片保留原骨架摆动，迈步时将外摆向上带起，给小腿和鞋尖留出空间。
    for(const s of skirt){
      const lift=Math.min(actual/2.2,1)*.095+Math.abs(legSwing)*.044+hop*.023+stepBias*.014;
      const weight=s.level===1?.16:s.level===2?.34:.50;
      s.bone.getWorldPosition(footL);footR.copy(footL);footR.y+=lift*weight;
      footR.x+=Math.sin(heading)*lift*weight*.38;footR.z+=Math.cos(heading)*lift*weight*.38;
      s.bone.parent.worldToLocal(footL);s.bone.parent.worldToLocal(footR);
      s.delta.copy(footR).sub(footL);s.bone.position.add(s.delta);
    }
    for(const l of limbs){
      const swing=l.side*legSwing;
      const angle=l.type==='Thigh'?swing*.65+hop*(l.side>0?.59:-.15):
        l.type==='Calf'?-Math.max(0,-swing)*.41-hop*(l.side>0?.56:.77):
        l.type==='Upperarm'?-swing*.57+hop*(l.side>0?.51:-.61):Math.max(0,swing)*.43+hop*.46;
      l.bone.getWorldQuaternion(boneQ);boneQ.invert();spinAxis.set(Math.cos(heading),0,-Math.sin(heading)).applyQuaternion(boneQ);
      l.delta.setFromAxisAngle(spinAxis,angle);
      if(l.type==='Upperarm'){spinAxis.set(-Math.sin(heading),0,-Math.cos(heading)).applyQuaternion(boneQ);spin.setFromAxisAngle(spinAxis,l.side*(hop*.94+Math.abs(swing)*.16));l.delta.multiply(spin)}
      l.bone.quaternion.multiply(l.delta);
      const stride=grounded?clamp((actual-1.85)/1.50,0,1):0;
      if(hop>.01||stride>.01&&(l.type==='Upperarm'||l.type==='Forearm')){
        // 以角色前方和两侧描述腾空姿势，用实际的下一关节作目标，保留原来的骨长。
        const right=l.side<0;
        const aim=hop<=.01?(l.type==='Upperarm'?[-l.side*.55,-.64,-swing*1.47]:[-l.side*.40,.37-.42*swing,.92-.49*swing]):
          l.type==='Upperarm'?(right?[.94,.98,.22]:[-.93,.05,-.46]):
          l.type==='Forearm'?(right?[.55,1,.12]:[-.92,-.08,-.26]):
          l.type==='Thigh'?(right?[.19,-.48,.79]:[-.10,-.89,-.23]):
          right?[.20,-.94,.38]:[-.23,-.44,-.83];
        const [side,up,front]=aim;
        l.bone.getWorldPosition(shoulder);l.tip.getWorldPosition(fromElbow);
        toElbow.set(side*Math.cos(heading)-front*Math.sin(heading),up,-side*Math.sin(heading)-front*Math.cos(heading)).add(shoulder);
        l.bone.worldToLocal(fromElbow).normalize();l.bone.worldToLocal(toElbow).normalize();
        spin.setFromUnitVectors(fromElbow,toElbow);liftArm.identity().slerp(spin,hop>.01?hop*.98:stride*.77);
        l.bone.quaternion.multiply(liftArm);l.delta.multiply(liftArm);
      }
    }
    for(let i=0;i<hair.length;i++){
      const h=hair[i];h.bone.getWorldQuaternion(boneQ);boneQ.invert();
      spinAxis.set(Math.cos(heading),0,-Math.sin(heading)).applyQuaternion(boneQ).normalize();
      h.delta.setFromAxisAngle(spinAxis,(-hairLift-nearWall*.25-stepBias*.13+Math.sin(walkPhase+i*.45)*hairLift*.12)*h.weight);
      spinAxis.set(0,1,0).applyQuaternion(boneQ);spin.setFromAxisAngle(spinAxis,-turnLean*h.weight);
      h.delta.multiply(spin);h.bone.quaternion.multiply(h.delta);
    }
    // 台阶窄于步幅。将承重鞋底贴在其正下方的踏面，躯干随两脚间的高度差过渡。
    leftFoot.getWorldPosition(footL);rightFoot.getWorldPosition(footR);
    const clearance=f=>f.y-.079-space.floor(f.x,f.z,p.y+.21);
    const contact=grounded?clamp(-Math.min(clearance(footL),clearance(footR)),-.17,.18):0;
    soleShift=T.MathUtils.damp(soleShift,contact,grounded?27:15,dt);
    if(stepBias>.08&&grounded){
      root.position.y+=soleShift;
      const descending=Math.cos(heading)<0,first=LAYOUT.hall[1]+6.7+7*.34;
      const u=(first-p.z+.17)/.34,step=Math.floor(u),t=descending?1-(u-step):u-step;
      const treadCenter=first-step*.34,direction=descending?1:-1;
      const locked=step>=0&&step<8&&Math.abs(Math.cos(heading))>.72&&actual>.18;
      for(const [i,[thigh,calf]] of legs.entries()){
        thigh.bone.getWorldPosition(hip);calf.bone.getWorldPosition(knee);calf.tip.getWorldPosition(ankle);
        const a=hip.distanceTo(knee),b=knee.distanceTo(ankle),lift=clamp((ankle.y-p.y-.12)*.83,0,.13);
        const tread=space.floor(ankle.x,ankle.z,p.y+.22);
        ankle.y=T.MathUtils.lerp(ankle.y,tread+.079+lift,stepBias);
        const planted=i===(step&1);
        if(locked){
          // 支撑脚停在踏面中央。另一脚经过前一级到后一级，并在交接前放平。
          const f=T.MathUtils.smootherstep(t,.06,.90),from=treadCenter-direction*.34,to=treadCenter+direction*.34;
          const startY=space.floor(ankle.x,from,p.y+.45,.005),endY=space.floor(ankle.x,to,p.y+.45,.005);
          const targetZ=planted?treadCenter:T.MathUtils.lerp(from,to,f);
          const targetY=planted?space.floor(ankle.x,treadCenter,p.y+.45,.005):T.MathUtils.lerp(startY,endY,f)+Math.sin(f*Math.PI)*.12;
          ankle.z=T.MathUtils.lerp(ankle.z,targetZ,stepBias);ankle.y=T.MathUtils.lerp(ankle.y,targetY+.079,stepBias);
        }
        legAxis.copy(ankle).sub(hip);const length=clamp(legAxis.length(),Math.abs(a-b)+.001,a+b-.001);
        legAxis.normalize();bendDir.set(-Math.sin(heading),0,-Math.cos(heading));bendDir.addScaledVector(legAxis,-legAxis.dot(bendDir)).normalize();
        const along=(a*a-b*b+length*length)/(2*length);
        kneeGoal.copy(hip).addScaledVector(legAxis,along).addScaledVector(bendDir,Math.sqrt(Math.max(0,a*a-along*along)));
        // 两段腿骨只作旋转，使鞋尖能跨过上一级，承重脚跟贴住当前踏面。
        for(const [segment,goal] of [[thigh,kneeGoal],[calf,ankle]]){
          segment.tip.getWorldPosition(fromElbow);segment.bone.worldToLocal(fromElbow).normalize();
          toElbow.copy(goal);segment.bone.worldToLocal(toElbow).normalize();
          spin.setFromUnitVectors(fromElbow,toElbow);segment.bone.quaternion.multiply(spin);segment.delta.multiply(spin);
        }
        if(locked&&(planted||t<.09||t>.87)){
          const foot=ankleTurns[i];restFoot.setFromAxisAngle(upAxis,heading).multiply(foot.rest);
          foot.bone.getWorldQuaternion(boneQ);spin.copy(boneQ).invert().multiply(restFoot);
          foot.delta.identity().slerp(spin,stepBias);foot.bone.quaternion.multiply(foot.delta);
        }
      }
    }
    if(grounded&&soles.length===2){
      root.position.copy(p);root.position.y+=soleShift;root.updateMatrixWorld(true);
      for(let i=0;i<2;i++){
        const {mesh,ids}=soles[i];let gap=Infinity;
        for(const id of ids){
          mesh.getVertexPosition(id,solePoint).applyMatrix4(mesh.matrixWorld);
          const gapHere=solePoint.y-space.floor(solePoint.x,solePoint.z,p.y+.29,.004);
          if(gapHere<gap){gap=gapHere;soleContacts[i].copy(solePoint)}
        }
        soleGaps[i]=gap;
      }
      const correction=clamp(.002-Math.min(...soleGaps),-.23,.23);
      soleShift+=correction;for(let i=0;i<2;i++)soleGaps[i]+=correction;
    }
  }
  const ground=.017;
  function tick(now){
    const dt=last?clamp((now-last)/1000,0,.10):1/60;last=now;
    const n=Math.max(1,Math.ceil(dt*90));for(let i=0;i<n;i++)advance(dt/n);pose(dt);sync(dt);
  }
  function zoom(scale){distance=clamp(distance/scale,1.6,7);sync(0)}
  function freeInput(){return !document.querySelector('dialog[open]')}
  button.onclick=switchMode;by('walkExit').onclick=()=>leave(true);by('jumpBtn').onpointerdown=e=>{e.preventDefault();buffer=.17};
  for(const btn of [button,by('walkExit')]){
    btn.addEventListener('touchend',e=>{
      const finger=e.changedTouches[0];if(!btn.contains(document.elementFromPoint(finger.clientX,finger.clientY)))return;
      e.preventDefault();if(!btn.disabled)btn.click();
    },{passive:false});
  }
  window.addEventListener('keydown',e=>{
    if(!freeInput()||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(e.code==='KeyV'&&!e.repeat&&!button.disabled){e.preventDefault();switchMode();return}
    if(!mode)return;if(e.code==='Escape'){e.preventDefault();leave(true);return}
    if(!['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight','Space'].includes(e.code))return;
    if(e.code==='Space'&&e.target.closest('button'))return;e.preventDefault();e.stopPropagation();held.add(e.code);if(e.code==='Space'&&!e.repeat)buffer=.17;
  },true);
  window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',clear);
  document.addEventListener('visibilitychange',clear);by('help').addEventListener('click',clear);
  can.addEventListener('contextmenu',e=>{if(mode)e.preventDefault()});
  can.addEventListener('pointerdown',e=>{if(!mode||drag!==null)return;drag=e.pointerId;orbitDrag=mode===2&&(e.button===2||e.pointerType==='touch'&&joyId!==null);can.setPointerCapture(e.pointerId);can.focus({preventScroll:true});can.dataset.mx=e.clientX;can.dataset.my=e.clientY});
  can.addEventListener('pointermove',e=>{if(!mode||drag!==e.pointerId)return;const dx=(e.clientX-Number(can.dataset.mx))*.005;
    if(orbitDrag)orbitOffset=T.MathUtils.euclideanModulo(orbitOffset-dx+Math.PI,2*Math.PI)-Math.PI;else yaw-=dx;
    pitch=clamp(pitch-(e.clientY-Number(can.dataset.my))*.004,-1.05,.97);can.dataset.mx=e.clientX;can.dataset.my=e.clientY});
  can.addEventListener('lostpointercapture',()=>{drag=null});
  can.addEventListener('wheel',e=>{if(mode){e.preventDefault();if(mode===2)zoom(Math.exp(-clamp(e.deltaY,-120,120)*.002))}},{passive:false});
  const joy=by('joy');
  function steer(e){const b=joy.getBoundingClientRect();stick.set((e.clientX-b.left-b.width/2)/(b.width*.40),(e.clientY-b.top-b.height/2)/(b.height*.40)).clampLength(0,1);
    joy.firstElementChild.style.transform='translate('+stick.x*22+'px,'+stick.y*22+'px)'}
  joy.onpointerdown=e=>{if(joyId!==null)return;joyId=e.pointerId;joy.setPointerCapture(e.pointerId);steer(e)};
  joy.onpointermove=e=>{if(joyId===e.pointerId)steer(e)};joy.onlostpointercapture=()=>{joyId=null;stick.set(0,0);joy.firstElementChild.style.transform=''};
  return {get active(){return !!mode},get mode(){return mode},get position(){return p.clone()},get motion(){return motion},get grounded(){return grounded},get footClearances(){return soles.length===2?soleGaps.slice():null},switchMode,leave,zoom,tick,fov};
}

// 怀士堂近景使用独立构件，与柱、台阶和主体共用同一局部坐标。
function configureCourt(){
  document.querySelector('.hero h1').textContent='怀士堂';
  document.querySelector('.hero .sub').textContent='北门庭院';
  document.querySelector('.hero .intro').textContent='从草坪走近石阶，穿过两座塔楼之间的门廊。';
  document.querySelector('.hgroup h2').textContent='庭院视点';
  document.getElementById('reset').lastChild.textContent='回到庭院';
}
function enamelSign(text,round=false){
  const c=document.createElement('canvas');c.width=512;c.height=round?512:288;
  const g=c.getContext('2d'),cx=c.width/2,cy=c.height/2;
  if(round){
    g.fillStyle='#d9dbcd';g.beginPath();g.arc(cx,cy,251,0,Math.PI*2);g.fill();
    g.strokeStyle=g.fillStyle='#235746';
    for(const r of [246,232,127,119]){g.lineWidth=r===246?5:3;g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.stroke()}
    function letters(s,from,to,r,size,flip){
      Array.from(s).forEach((ch,i)=>{const a=from+(to-from)*i/(s.length-1);g.save();g.translate(cx+r*Math.cos(a),cy+r*Math.sin(a));g.rotate(a+(flip?-Math.PI/2:Math.PI/2));g.font='600 '+size+'px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(ch,0,0);g.restore()});
    }
    letters('中山大學',-2.42,-.72,174,47,false);letters('SUN YAT-SEN UNIVERSITY',3.22,-.08,184,26,true);
    g.fillStyle='#d9dbcd';g.fillRect(128,128,256,256);g.strokeStyle=g.fillStyle='#285a47';g.lineWidth=5;
    g.beginPath();g.moveTo(cx-105,cy);g.bezierCurveTo(cx-105,cy-36,cx-81,cy-52,cx-51,cy-55);g.bezierCurveTo(cx-37,cy-101,cx+36,cy-101,cx+51,cy-55);g.bezierCurveTo(cx+120,cy-53,cx+125,cy+45,cx+55,cy+52);g.bezierCurveTo(cx+34,cy+97,cx-39,cy+97,cx-54,cy+52);g.bezierCurveTo(cx-83,cy+51,cx-105,cy+30,cx-105,cy);g.stroke();
    g.fillRect(cx-13,cy-43,26,83);g.fillRect(cx-4,cy-61,8,19);g.fillRect(cx-57,cy+6,114,6);
    for(const xx of [-47,-34,34,47])g.fillRect(cx+xx,cy+8,5,33);
    g.fillStyle='#e0e1d6';g.fillRect(cx-6,cy-33,12,35);g.fillRect(cx-7,cy+13,14,26);
  }else{
    g.fillStyle='#264b67';g.fillRect(0,0,512,288);g.strokeStyle='#d0d6cb';g.lineWidth=8;g.strokeRect(9,9,494,270);
    g.fillStyle='#e4e8df';g.textAlign='center';g.font='40px sans-serif';g.fillText('新港西路',256,70);g.font='bold 163px sans-serif';g.fillText(text,256,237);
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  return new T.MeshStandardMaterial({map,roughness:.55,metalness:.07,transparent:round,alphaTest:round?.15:0,polygonOffset:true,polygonOffsetFactor:-1});
}
function entranceCraft(p){
  // 用连续砖墩围出洞口。门樘退入砖面，深浅由真实侧壁形成。
  for(const [a,b] of [[-3.04,-2.58],[-1.12,-.735],[.735,1.12],[2.58,3.04]]){
    p.box((a+b)/2,2.55,3.60,b-a,2.06,.57,'#ebd8c6','brick');
  }
  p.box(0,4.04,3.47,6.08,.99,.41,'#ebd8c6','brick');
  for(const x of [-1.85,0,1.85]){
    const z=3.71;
    p.box(x,2.54,z-.025,1.47,2.085,.15,'#534d42','lacquer');
    p.box(x,3.585,3.788,1.57,.109,.23,'#a8987f','granite');
    for(const side of [-1,1]){
      const cx=x+side*.344;
      p.box(cx,2.548,z+.043,.68,2.004,.091,'#5e5950','lacquer');
      p.box(x+side*.707,2.54,z+.087,.048,2.055,.112,'#5a5245','lacquer');
      // 门扇外框、内凹嵌板和四十五度斜角线脚用放样截面连为一体。
      for(const edge of [-1,1]){
        const mid=cx+edge*.145,bot=1.673,top=2.815,rx=.129,cy=(top+bot)*.5,ry=(top-bot)*.5;
        const rings=[[rx,ry,.103],[rx-.014,ry-.014,.116],[rx-.023,ry-.023,.114],[rx-.039,ry-.039,.086]];
        for(let k=1;k<rings.length;k++){
          const corners=([w,h,d])=>[[-w,-h],[w,-h],[w,h],[-w,h]].map(([u,v])=>[mid+u,cy+v,z+d]);
          const a=corners(rings[k-1]),b=corners(rings[k]);
          for(let j=0;j<4;j++){const n=(j+1)%4;p.surface([a[j],a[n],b[n],a[j],b[n],b[j]],k===2?'#716a5d':k===1?'#625e53':'#565247','lacquer')}
        }
        p.box(mid,cy,z+.081,.187,ry*2-.078,.012,'#5a584f','lacquer');
      }
      const pane=new T.Shape();pane.absellipse(0,0,.256,.282,0,Math.PI*2,false);
      const glass=new T.ShapeGeometry(pane,64);p.add(glass,'#b3c1c2',[cx,3.144,z+.099],[1,1,1],[0,0,0],'courtPane');glass.dispose();
      const ring=new T.TorusGeometry(.249,.012,8,64);p.add(ring,'#666355',[cx,3.144,z+.108],[1,1.105,1],[0,0,0],'lacquer');ring.dispose();
      for(const e of [-1,1])p.box(cx+e*.119,3.144,z+.111,.036,.553,.03,'#605c52','lacquer');
      p.box(cx,2.84,z+.101,.613,.047,.042,'#686256','lacquer');
      const hx=x+side*.057;
      p.box(hx,2.30,z+.115,.047,.25,.022,'#6f6551');
      p.rod([hx,2.22,z+.15],[hx,2.39,z+.15],.014,.014,'#a18b68',12);
      for(const h of [2.22,2.39])p.rod([hx,h,z+.118],[hx,h,z+.15],.014,.014,'#8f7d61',10);
    }
  }
  // 窄砖券按辐射状排列，砖长边指向拱心。砂浆线用后方连续拱带承接。
  const z=3.855,cy=3.63,inner=.744,outer=.965;
  for(let j=0;j<54;j++){
    const aa=(j+.07)*Math.PI/54,bb=(j+.93)*Math.PI/54;
    const pt=(a,r,h)=>[r*Math.cos(a),cy+r*Math.sin(a),h];
    p.surface([pt(aa,inner,z),pt(bb,inner,z),pt(bb,outer,z),pt(aa,inner,z),pt(bb,outer,z),pt(aa,outer,z)],choose(['#ab765a','#ad795e','#956a50','#ba8666','#9e6d54']));
    p.surface([pt(aa,inner,z-.04),pt(bb,inner,z-.04),pt(bb,inner,z),pt(aa,inner,z-.04),pt(bb,inner,z),pt(aa,inner,z)],'#785c48');
  }
}
async function installCourtMaterials(){
  const loader=new THREE.TextureLoader();
  for(const [kind,key] of [['brick','brick'],['ashlar','stone']]){
    const [map,normalMap,roughnessMap]=await Promise.all(['color','normal','surface'].map(role=>loader.loadAsync(COURT_MAPS[kind+'-'+role])));
    if(window.campusWeb)for(const [i,tex] of [map,normalMap,roughnessMap].entries())window.campusWeb.track(kind+'-'+['color','normal','surface'][i],tex);
    for(const tex of [map,normalMap,roughnessMap]){tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),12)}
    map.colorSpace=THREE.SRGBColorSpace;
    const m=mats[key];m.map.dispose();m.normalMap.dispose();Object.assign(m,{map,normalMap,roughnessMap,roughness:1});
    m.normalScale.setScalar(key==='brick'?.74:.85);
    m.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 masonryWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nmasonryWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
      shader.fragmentShader='varying vec3 masonryWorld;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
        #include <color_fragment>
        vec3 w=masonryWorld;float wave=sin(w.x*1.51+w.z*1.19+sin(w.y*.84))*sin(w.y*.74+w.z*.7);
        float runoff=pow(.5+.5*sin(w.x*19.41+w.z*10.32+.32*sin(w.y*1.79)),7.);
        float base=1.-smoothstep(.08,1.45,w.y);
        diffuseColor.rgb*=vec3(1.+wave*.048,1.+wave*.039,1.+wave*.030)*(1.-base*(.12+.12*runoff)-.032*runoff);
      `);
    };m.needsUpdate=true;
  }
  const turf=await loader.loadAsync(COURT_MAPS.lawn);turf.colorSpace=T.SRGBColorSpace;turf.wrapS=turf.wrapT=T.RepeatWrapping;turf.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());
  if(window.campusWeb)window.campusWeb.track('lawn',turf);
  mats.grass.map=turf;
  mats.grass.onBeforeCompile=s=>{
    s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
      vec2 w=vMapUv*3.1,cell=w*.17;
      float humus=texture2D(map,w*.041+vec2(.71,.52)).g,water=.5+.5*sin(cell.x*3.+1.4*sin(cell.y*1.9+1.2))*cos(cell.y*2.37-cell.x*.71);
      vec3 blades=texture2D(map,w*.78).rgb,turned=texture2D(map,mat2(.85,.527,-.527,.85)*w*.87+vec2(.37,.72)).rgb;
      vec3 lawn=mix(blades,turned,.40+.22*sin(cell.x*4.+cell.y*2.7));
      float dry=smoothstep(.37,.91,water+.22*(humus-.16));
      vec2 edge=abs(w-vec2(0.,3.9))-vec2(4.3,4.9);
      float turfEdge=abs(length(max(edge,0.))+min(max(edge.x,edge.y),0.)-7.8);
      float wear=(1.-smoothstep(.05,.49,turfEdge))*(.53+.31*sin(w.x*2.5+w.y*1.54)+.14*cos(w.x*7.1));
      lawn*=mix(vec3(.82,.95,.82),vec3(1.29,1.07,.77),dry);
      lawn=mix(lawn,vec3(.118,.087,.055),wear*.75);
      diffuseColor.rgb*=lawn;
    `);
  };mats.grass.customProgramCacheKey=()=>'court-lawn-fibres';mats.grass.needsUpdate=true;
  mats.greenCaps.map=null;mats.greenCaps.color.set('#64765f');mats.greenCaps.roughness=.62;
  mats.courtPane=new T.MeshPhysicalMaterial({color:0x9eaeb1,vertexColors:true,metalness:.28,roughness:.29,clearcoat:.27,clearcoatRoughness:.17,envMapIntensity:1.24,emissive:0x626c70,emissiveIntensity:.19});
  mats.lacquer.roughness=.39;mats.lacquer.envMapIntensity=.74;mats.lacquer.emissive.setHex(0x777970);mats.lacquer.emissiveIntensity=.084;
  const dressing=texture((g,n)=>{
    const im=g.createImageData(n,n);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const u=x/n,v=y/n,i=(y*n+x)*4,broad=noise(u*7,v*7,7),mineral=noise(u*180,v*180,180);
      const grit=(random()-.5)*8+(mineral-.5)*14+(broad-.5)*17;
      const mica=mineral>.83?(mineral-.83)*117:0,feldspar=noise(u*113,v*113,113)>.84?8:0;
      im.data.set([198+grit-mica+feldspar,198+grit-mica+feldspar,188+grit-mica+feldspar,255],i);
    }g.putImageData(im,0,0);
  },1024);
  mats.granite.map=dressing;mats.granite.normalMap=null;
  const surfaceNoise=`
    float surfaceHash(vec3 p){p=fract(p*.3183099+vec3(.13,.43,.71));p*=19.19;return fract((p.x+p.y)*p.z*(p.x+p.z));}
    float surfaceNoise(vec3 p){
      vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(surfaceHash(i),surfaceHash(i+vec3(1,0,0)),f.x),mix(surfaceHash(i+vec3(0,1,0)),surfaceHash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(surfaceHash(i+vec3(0,0,1)),surfaceHash(i+vec3(1,0,1)),f.x),mix(surfaceHash(i+vec3(0,1,1)),surfaceHash(i+1.),f.x),f.y),f.z);
    }`;
  for(const [m,paint] of [[mats.lacquer,true],[mats.granite,false]]){
    m.onBeforeCompile=s=>{
      s.vertexShader='varying vec3 craftP;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ncraftP=(modelMatrix*vec4(transformed,1.)).xyz;');
      s.fragmentShader='varying vec3 craftP;\n'+surfaceNoise+'\n'+s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n'+(paint?`
        vec3 w=craftP;float broad=surfaceNoise(w*vec3(12.,1.5,12.)),streak=surfaceNoise(w*vec3(128.,4.3,128.));
        float fleck=smoothstep(.63,.82,surfaceNoise(w*135.))*(1.-smoothstep(.002,.014,fwidth(w.y)));
        diffuseColor.rgb*=.86+.23*broad+.12*streak;
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.31,.24,.17),fleck*.14);
      `:`
        vec3 w=craftP;float fleck=surfaceNoise(w*92.+5.3),quartz=smoothstep(.62,.82,fleck);
        float veins=surfaceNoise(w*4.4+surfaceNoise(w*19.)*.69);
        float detail=1.-smoothstep(.003,.023,max(length(dFdx(w)),length(dFdy(w))));
        diffuseColor.rgb*=vec3(.91,.90,.88)+veins*vec3(.17,.18,.22);
        diffuseColor.rgb+=detail*(vec3(.017,.015,.016)*quartz-vec3(.013,.012,.011)*(1.-smoothstep(.16,.38,fleck)));
        float stepArea=(1.-smoothstep(1.47,1.63,abs(w.x)))*smoothstep(-21.6,-21.3,w.z)*(1.-smoothstep(-18.9,-18.6,w.z));
        float wear=stepArea*(1.-smoothstep(.20,1.46,abs(w.x)))*(.5+.5*veins);
        diffuseColor.rgb*=1.+.20*wear;
      `));
    };m.customProgramCacheKey=()=>paint?'court-aged-paint':'court-split-granite';m.needsUpdate=true;
  }
  mats.tile.normalScale.setScalar(.30);mats.tile.color.set('#b4af92');
  const glaze=texture((g,s)=>{
    g.fillStyle='#324b41';g.fillRect(0,0,s,s);const n=6,w=s/n;
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const c=(i+.5)*w,d=(j+.5)*w;
      g.strokeStyle='#536e5c';g.lineWidth=w*.087;g.strokeRect(i*w+3,j*w+3,w-6,w-6);
      for(let k=0;k<8;k++){
        g.save();g.translate(c,d);g.rotate(k*Math.PI/4);g.lineWidth=w*.068;g.strokeStyle=k%2?'#6d8270':'#758b76';
        g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-w*.21,-w*.12,-w*.10,-w*.30,0,-w*.36);g.bezierCurveTo(w*.105,-w*.28,w*.12,-w*.15,0,0);g.stroke();g.restore();
      }
    }
  },512);
  mats.glaze.map=glaze;mats.glaze.normalScale.setScalar(.13);mats.glaze.roughness=.52;
  if(COURT_GI){
    const data=window.campusWeb?await window.campusWeb.irradiance:
      await new Response(new Blob([unpackBytes(COURT_GI)]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    courtIrradiance=new T.Data3DTexture(new Uint8Array(data),116,72,82);
    courtIrradiance.format=T.RGBAFormat;courtIrradiance.type=T.UnsignedByteType;
    courtIrradiance.magFilter=courtIrradiance.minFilter=T.LinearFilter;courtIrradiance.needsUpdate=true;
  }
}
let courtIrradiance=null;
function useCourtIrradiance(){
  if(!courtIrradiance)return;
  for(const m of new Set([...components.hall.children,...components.courtDetail.children].map(o=>o.material))){
    if(!m?.isMeshStandardMaterial||m===mats.courtPane)continue;
    const before=m.onBeforeCompile.bind(m),cache=m.customProgramCacheKey();
    m.onBeforeCompile=(s,r)=>{
      before(s,r);s.uniforms.courtLight={value:courtIrradiance};
      s.vertexShader='varying vec3 courtWorld;\n'+s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
        vec4 localCourt=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          localCourt=instanceMatrix*localCourt;
        #endif
        courtWorld=(modelMatrix*localCourt).xyz;`);
      s.fragmentShader='varying vec3 courtWorld;uniform highp sampler3D courtLight;\n'+s.fragmentShader.replace('#include <opaque_fragment>',`
        vec3 cn=inverseTransformDirection(normal,viewMatrix);
        vec3 pu=(courtWorld+cn*.185+vec3(13.,.3,35.))/vec3(26.,15.,19.);
        if(all(greaterThan(pu,vec3(0.)))&&all(lessThan(pu,vec3(1.)))){
          vec4 sh=texture(courtLight,pu);
          float irradiance=clamp((sh.x+2.*dot((sh.yzw-.5)/1.8,cn))/(.805+.195*cn.y),.13,1.);
          outgoingLight-=min(outgoingLight*.9,(1.-irradiance)*(reflectedLight.indirectDiffuse+.60*reflectedLight.indirectSpecular));
          outgoingLight*=mix(vec3(.84,.88,.92),vec3(1.),irradiance);
        }
        #include <opaque_fragment>`);
    };m.customProgramCacheKey=()=>cache+'-courtyard-gather';m.needsUpdate=true;
  }
}
function doorReflection(cubeMap,gain=1){
  const m=mats.courtPane;
  m.onBeforeCompile=s=>{
    s.uniforms.porchCube={value:cubeMap};
    s.vertexShader='varying vec3 doorPoint;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ndoorPoint=(modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader='varying vec3 doorPoint;uniform samplerCube porchCube;\n'+s.fragmentShader.replace('#include <opaque_fragment>',`
      vec3 P=doorPoint,V=normalize(P-cameraPosition),N=normalize(cross(dFdx(P),dFdy(P)));if(dot(V,N)>0.)N=-N;
      vec3 ray=reflect(V,N);ray.xy+=vec2(.018*sin(P.y*8.+P.x*3.),.022*sin(P.x*9.1));
      vec3 refl=textureCube(porchCube,normalize(P-vec3(.1,3.2,-23.65)+ray*17.)).rgb*${gain.toFixed(1)};
      float drift=sin(P.x*7.+.19*sin(P.y*2.4)),f=clamp(-dot(V,N),0.,1.);
      float inside=P.x-.76*V.x/max(f,.33),curtain=smoothstep(.6,.94,fract(inside*.83));
      vec3 room=mix(vec3(.026,.030,.031),vec3(.087,.081,.065),curtain*(.73+.22*sin(inside*70.)));
      outgoingLight=vec3(.033,.044,.049)+room*.50+mix(vec3(dot(refl,vec3(.24,.62,.14)))*vec3(.92,1.,1.06),min(refl,vec3(1.25)),.43)*(.24+.34*pow(1.-f,3.))*(.83+.17*drift);
      #include <opaque_fragment>`);
  };m.needsUpdate=true;
}

function courtTreads(p){
  for(let i=0;i<8;i++){
    const z=6.7+i*.34,h=(8-i)*.19,cuts=i%2?[-1.55,-.54,.78,1.55]:[-1.55,-.85,.46,1.55];
    for(let j=1;j<cuts.length;j++){
      const left=cuts[j-1]+.002,right=cuts[j]-.002,sections=[];
      for(let k=0;k<=8;k++){
        const x=left+(right-left)*k/8,top=h-.011*Math.exp(-((x-.09)**2)/.55);
        sections.push([[x,top,z-.188],[x,top,z+.151],[x,top-.003,z+.174],[x,top-.013,z+.185],[x,top-.021,z+.188],[x,Math.max(0,h-.20),z+.188]]);
      }
      const tone=choose(['#aeafa7','#a1a399','#abada6','#9fa199']);
      for(let k=1;k<sections.length;k++)for(let q=0;q<5;q++){
        const a=sections[k-1],b=sections[k];p.surface([a[q+1],b[q+1],b[q],a[q+1],b[q],a[q]],q===4?'#999c95':tone,'granite');
      }
    }
  }
}
function courtLandscape(){
  const p=new Part('庭前树穴和林下地表'),saved=seed;seed=42091;
  for(const [cx,cz,rad] of [[-12.1,-12.7,1.42],[11.85,-17.8,1.36],[-13.2,-22.7,1.36],[15.85,-25.6,1.33]]){
    const rim=[];for(let i=0;i<40;i++){const a=i*Math.PI/20,r=rad*(.94+.09*noise(i*.42,cz));rim.push([cx+r*Math.cos(a),.041,cz+r*Math.sin(a)])}
    for(let i=0;i<40;i++){
      const a=rim[i],b=rim[(i+1)%40],e=[cx+(a[0]-cx)*1.09,.031,cz+(a[2]-cz)*1.09],f=[cx+(b[0]-cx)*1.09,.031,cz+(b[2]-cz)*1.09];
      p.surface([[cx,.216,cz],b,a],choose(['#675c46','#635844','#605743','#665b47']));
      p.surface([a,b,f,a,f,e],choose(['#88806b','#908774','#857c68']),'granite');
    }
    for(let j=0;j<215;j++){
      const a=range(0,6.28),r=rad*Math.sqrt(random())*1.19,x=cx+r*Math.cos(a),z=cz+r*Math.sin(a),u=range(0,6.28),l=range(.025,.092),w=l*range(.21,.40),y=.048,dx=Math.cos(u),dz=Math.sin(u);
      const one=[x,y,z],two=[x+l*.48*dx-dz*w,y+.008,z+l*.48*dz+dx*w],tip=[x+l*dx,y+.004,z+l*dz],four=[x+l*.45*dx+dz*w,y+.003,z+l*.45*dz-dx*w];
      p.surface([one,two,tip,one,tip,four],choose(['#a8976b','#796a4e','#9b835b','#887754']));
    }
  }
  // 草丛中的酢浆草呈不规则的小片分布。小叶沿折线下垂，贴近脚边才明显。
  for(let patch=0;patch<145;patch++){
    const cx=range(-8.9,8.9),cz=range(-9.0,1.4);
    for(let j=0;j<21;j++){
      const x=cx+range(-.30,.30),z=cz+range(-.19,.19);
      const xx=Math.max(0,Math.abs(x)-4.3),zz=Math.max(0,Math.abs(z-2.1)-4.9);if(Math.hypot(xx,zz)>7.72)continue;
      const h=range(.029,.061),r=range(.017,.033),dir=range(0,6.28);
      for(let k=0;k<3;k++){const a=dir+k*2.094,dx=Math.cos(a),dz=Math.sin(a);
        const start=[x,h,z],tip=[x+dx*r,h+.001,z+dz*r],left=[x+dx*r*.62-dz*r*.37,h+.006,z+dz*r*.62+dx*r*.37],right=[x+dx*r*.62+dz*r*.37,h+.004,z+dz*r*.62-dx*r*.37];
        p.surface([start,tip,left,start,right,tip],choose(['#758443','#849050','#627b41','#8a9353']),'shrub');
      }
    }
  }
  seed=saved;return p.finish();
}
function courtDetail(){
  const p=new Part('北门廊细部'),seedBefore=seed;seed=1917;
  entranceCraft(p);
  // 宽挑檐下红色封檐板和椽尾造出实拍中可辨认的屋顶厚度。
  for(const tx of [-5.35,5.35])for(const side of [-1,1]){
    const ridge=[tx,12.826,7.148],end=[tx+side*2.95,10.88,7.148],drop=a=>[a[0],a[1]-.19,a[2]];
    p.surface([ridge,end,drop(end),ridge,drop(end),drop(ridge)],'#8d4838','wood');
    for(let j=1;j<=10;j++){const t=j/10;p.box(tx+side*2.83*t,12.70-1.86*t,6.99,.092,.13,.30,'#78533d','wood',[0,0,-side*.585])}
  }
  // 铜绿色落水管有独立的承插口、抱箍及固定至砖墙的耳片。
  for(const s of [-1,1]){
    const towerX=s*5.35;
    for(const [y,z,w,h] of [[4.64,6.58,1.52,.70],[7.65,6.58,1.54,.77],[10.97,6.79,1.21,.49]]){
      // 石饰直接嵌在砖墙中央，侧面留出浅凿斜口和不连续的灰缝。
      p.box(towerX,y,z-.044,w,h,.089,'#e5cab4','brick');
      for(const side of [-1,1])p.box(towerX+side*(w*.5),y,z+.004,.028,h+.06,.036,'#91755f');
      for(const yy of [-1,1])p.box(towerX,y+yy*h*.51,z+.006,w+.056,.030,.035,'#a58d72');
      const ww=y<5?.32:.436,hh=y<5?.214:.266;
      const poly=[[0,-hh],[ww,0],[0,hh],[-ww,0]],outer=poly.map(([x,h])=>[towerX+x,y+h,z+.019]),inner=poly.map(([x,h])=>[towerX+x*.92,y+h*.92,z+.055]);
      for(let k=0;k<4;k++){let l=(k+1)%4;p.surface([outer[k],outer[l],inner[l],outer[k],inner[l],inner[k]],'#afa89a','granite')}
      p.surface([inner[0],inner[1],inner[2],inner[0],inner[2],inner[3]],'#c7c4b8','granite');
      if(y<5)for(const side of [-1,1])p.box(towerX+side*.54,y,z+.021,.118,.166,.043,'#c3beb1','granite');
    }
    for(const [xx,z,top] of [[3.03,6.54,7.43],[10.74,5.39,6.70]]){
      const x=s*xx;
      p.rod([x,.28,z],[x,top,z],.054,.054,'#536b59',14);
      for(let y=.59;y<top;y+=1.20){
        p.rod([x,y,z],[x,y+.077,z],.068,.064,'#536352',14);
        p.box(x,y+.028,z-.053,.19,.044,.035,'#6a7061');
      }
      p.rod([x,.30,z],[x+s*.12,.13,z+.15],.058,.062,'#536b59',14);
    }
    // 塔楼照片中可见红色封檐板、桁端和由多层砖组成的窗楣。
    for(const side of [-1,1]){
      const x=s*5.35,bx=x+side*2.78;
      p.surface([[x,12.83,7.147],[bx,10.99,7.147],[bx,10.80,7.147],[x,12.83,7.147],[bx,10.80,7.147],[x,12.64,7.147]],'#854b3c','wood');
    }
    for(const y of [3.92,7.36,9.92]){
      const x=s*5.35;
      for(let j=0;j<14;j++)p.box(x-.64+j*.098,y,6.61,.09,.21,.094,choose(['#976448','#ac7051','#b77b58','#ac7254']));
      p.box(x,y-.135,6.622,1.49,.042,.17,'#b2a48f','granite');
    }
    // 开扇窗的铰链轴朝外，玻璃、压条、横档和背后的室内栏杆具有真实间距。
    const wy=s<0?8.97:6.41,wx=s*5.35;
    p.box(wx,wy,6.52,1.10,1.51,.078,'#212321');
    p.box(wx+.24,wy,6.60,.42,1.33,.038,'#7d8989','glass');
    for(const e of [-1,1]){
      p.box(wx+e*.525,wy,6.61,.088,1.52,.21,'#645849','wood');
      p.box(wx,wy+e*.739,6.63,1.19,.086,.22,'#786953','wood');
      p.box(wx+.24+e*.222,wy,6.66,.039,1.39,.062,'#504940','wood');
    }
    for(const yy of [-.64,-.2,.23,.64])p.box(wx+.24,wy+yy,6.666,.45,.027,.048,'#514b41','wood');
    for(const dx of [-.37,-.21,-.05])p.rod([wx+dx,wy-.68,6.56],[wx+dx,wy-.19,6.56],.012,.012,'#784337',8);
    p.box(wx-.23,wy-.17,6.57,.47,.034,.05,'#814939','wood');p.box(wx,wy-.815,6.68,1.31,.10,.34,'#a6a196','granite');
    const sash=new Part('外开木窗');
    sash.box(.195,0,0,.39,1.31,.028,'#939d99','glass');
    for(const k of [0,.195,.39])sash.box(k,0,.026,.031,1.38,.049,'#51483e','wood');
    for(const h of [-.67,-.22,.22,.67])sash.box(.195,h,.028,.412,.029,.048,'#50463b','wood');
    const group=sash.finish();group.rotation.y=-.89;group.position.set(wx-.46,wy,6.765);group.updateMatrixWorld(true);
    group.children.forEach(o=>{const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const key=Object.keys(mats).find(k=>mats[k]===o.material);if(!p.bins.has(key))p.bins.set(key,[]);p.bins.get(key).push(g);o.geometry.dispose()});
    // 石阶侧面的实心翼墙和石帽，中心通道与原台阶同宽。
    const corner=(z,edge,h)=>[s*1.89+edge*.29,h,z];
    const height=z=>1.93-(z-6.52)*.56;
    function quad(a,b,c,d,color,material){p.surface([a,b,c,a,c,d],color,material)}
    for(let i=0;i<4;i++){
      const za=6.51+i*.684,zb=za+.683,ha=height(za),hb=height(zb);
      for(const e of [-1,1])quad(corner(za,e,.01),corner(zb,e,.01),corner(zb,e,hb),corner(za,e,ha),'#d2cbb9','stone');
      quad(corner(za,-1,ha),corner(za,1,ha),corner(zb,1,hb),corner(zb,-1,hb),'#c4bfad','granite');
      if(i===3)quad(corner(zb,-1,.01),corner(zb,1,.01),corner(zb,1,hb),corner(zb,-1,hb),'#c5c0af','granite');
    }
    // 门廊栏板为通花构件，菱心、八瓣和釉边之间留出看得到背景的透孔。
    for(const k of [-1,1]){
      const x=s*2.18+k*.285,z=6.45,y=2.07;
      for(const v of [-1,1]){
        p.box(x+v*.266,y,z,.042,.81,.115,'#5e806b');p.box(x,y+v*.382,z,.565,.047,.12,'#72927c');
      }
      for(const row of [-1,1])for(let j=0;j<8;j++){
        const a=j*Math.PI/4,b=(j+1)*Math.PI/4,cy=y+row*.187,r=.145;
        p.rod([x+r*Math.cos(a),cy+r*Math.sin(a),z],[x+r*Math.cos(b),cy+r*Math.sin(b),z],.016,.016,'#6a8a74',7);
        p.rod([x+r*.44*Math.cos(a),cy+r*.44*Math.sin(a),z+.012],[x+r*1.18*Math.cos(a+.21),cy+r*1.18*Math.sin(a+.21),z+.012],.011,.015,'#71937d',6);
      }
    }
    // 阶顶的盆栽分别生成叶簇，叶面中脉抬起，叶缘卷曲，不使用相机朝向平面。
    const px=s*1.88,pz=6.60,py=2.00;
    p.box(px,1.84,pz,.67,.32,.67,'#c4beac','granite');
    p.rod([px,py,pz],[px,py+.29,pz],.162,.236,'#994f38',24);
    p.rod([px,py+.245,pz],[px,py+.30,pz],.248,.25,'#ad6549',24);
    p.rod([px,py+.281,pz],[px,py+.306,pz],.215,.214,'#443e30',24);
    for(let j=0;j<57;j++){
      const a=range(0,Math.PI*2),r=range(.10,.34),h=range(.08,.23),tip=[px+r*Math.cos(a),py+.36+h,pz+r*Math.sin(a)];
      p.rod([px,py+.32,pz],tip,.01,.005,'#617145',5);
      for(let k=0;k<8;k++){
        const t=range(.32,1),u=a+(k%2?1:-1)*range(.45,1.1),l=range(.075,.15),w=l*range(.28,.48);
        const start=v3(px+(tip[0]-px)*t,py+.32+(h+.04)*t,pz+(tip[2]-pz)*t);
        const end=start.clone().add(v3(l*Math.cos(u),range(-.016,.075),l*Math.sin(u))),mid=start.clone().lerp(end,.50);
        const side=v3(-w*Math.sin(u),-.012,w*Math.cos(u)),ridge=mid.clone().add(v3(0,.012,0));
        const a1=mid.clone().add(side),a2=mid.clone().sub(side);
        const c=choose(['#708044','#9ba953','#647840','#a4a85d','#84944d','#b4ae67']);
        p.surface([start,a1,ridge,ridge,a1,end,start,ridge,a2,a2,ridge,end].map(v=>v.toArray()),c,'shrub');
      }
    }
  }
  const group=p.finish();seed=seedBefore;
  const marble=texture((g,n)=>{
    const im=g.createImageData(n,n);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const u=x/n,v=y/n,w=noise(5*u,5*v)+.31*noise(15*u,15*v),f=noise(26*u+w*4,26*v+w*4);
      const vein=Math.exp(-Math.abs(f-.48)*28),tone=158+32*(w-.6)+20*(noise(u*47,v*47)-.5)-27*vein;
      im.data.set([tone*.98,tone,tone*1.015,255],4*(x+n*y));
    }
    g.putImageData(im,0,0);
    for(const side of [-1,1])for(let j=0;j<5;j++){
      const a=(j+.25)*Math.PI/9,r=n*.83,cx=n*.5+side*r*.5*Math.cos(a),cy=n-n*.79*Math.sin(a);
      for(const [dy,col] of [[1.5,'#606d6999'],[-1,'#d6d7cba8']]){
        g.beginPath();for(let k=0;k<75;k++){const t=k/74,b=t*Math.PI*2.7,rr=(1-t)*n*.052;
          const xx=cx+side*rr*Math.cos(b+a),yy=cy+dy+rr*1.7*Math.sin(b+a);if(k)g.lineTo(xx,yy);else g.moveTo(xx,yy)}
        g.strokeStyle=col;g.lineWidth=2.2;g.stroke();
      }
    }
  },512);
  const arch=new T.Shape();arch.moveTo(-.701,0);arch.absellipse(0,0,.701,.697,Math.PI,0,true);arch.closePath();
  const face=new T.ShapeGeometry(arch,72),pos=face.attributes.position;
  for(let i=0;i<pos.count;i++)face.attributes.uv.setXY(i,pos.getX(i)/1.402+.5,pos.getY(i)/.697);
  const stoneFace=new T.Mesh(face,new T.MeshStandardMaterial({map:marble,emissiveMap:marble,emissive:0x87918c,emissiveIntensity:.11,roughness:.72}));
  stoneFace.position.set(0,3.63,3.852);stoneFace.receiveShadow=true;group.add(stoneFace);
  for(let i=0;i<2;i++){
    const map=texture((g,n)=>{
      const im=g.createImageData(n,n);
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const u=x/n,v=y/n,val=151+8*(noise(u*8,v*11)-.5)+12*(noise(u*32+3,v*43)-.5)+10*(random()-.5);
        im.data.set([val*.98,val,val*.945,255],(x+y*n)*4);
      }g.putImageData(im,0,0);g.scale(n/120,n/160);g.fillStyle=i?'#25342d':'#414d44';
      // 保留云石和槽口，以可辨识的隶楷字补足原图中缺失的笔画。
      const columns=i?[['懷士堂',60,18,41]]:[['學生要立志',89,22,22],['做大事',59,22,22],['不可做大官',29,22,22]];
      g.textAlign='center';g.textBaseline='top';
      for(const [chars,x,y,step] of columns){
        g.font=(i?'bold 35px LiSu, KaiTi, serif':'bold 18px KaiTi, SimSun, serif');
        Array.from(chars).forEach((ch,j)=>{
          g.fillStyle='#c4c7b8';g.fillText(ch,x+.5,y+j*step+.6);
          g.fillStyle=i?'#28483e':'#334a40';g.fillText(ch,x,y+j*step);
        });
      }
    },512);const slab=new T.Mesh(new T.PlaneGeometry(.673,.882),new T.MeshStandardMaterial({map,roughness:.74,envMapIntensity:.53}));
    slab.position.set(i?1.85:-1.85,4.05,3.801);slab.receiveShadow=true;group.add(slab);
  }
  for(const [mat,w,h,x,y,z] of [[enamelSign('492'),.265,.154,-.912,2.82,3.913],[enamelSign('',true),.484,.484,0,3.949,3.919]]){
    const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.receiveShadow=true;group.add(m);
  }
  return group;
}

/* 康乐园场景源码。这里的 +Z 为北，+X 为西。各 create 函数返回可独立移动、缩放、隐藏的组。
   修改地标位置请看 LAYOUT，修改镜头请看 stops。第三方引擎在上一个 script 内。 */
'use strict';
const T = THREE, { OrbitControls, mergeGeometries } = CampusTools;
const $ = id => document.getElementById(id);
const LAYOUT = {hall:[0,-28], lawn:[0,-1.8], statue:[0,19], pavilion:[0,35]};
const COURT=new URLSearchParams(location.search).get('scene')!=='campus';
const stops = COURT?[
  {name:'北立面',point:[0,5.81,-23],eye:[-3.08,-2.68,21.1],text:'两座砖塔楼夹着门廊，上层的外开木窗投影在墙面。'},
  {name:'门廊',point:[0,3.38,-24.13],eye:[-.45,-.83,4.10],text:'拱券下是深色双扇门，两侧保留石碑和壁灯。'},
  {name:'石阶',point:[.35,1.4,-20.74],eye:[3.15,.63,4.47],text:'石阶两旁是花岗岩翼墙，阶顶可见盆栽与通花栏板。'},
  {name:'山墙',point:[-5.35,9.38,-21.42],eye:[-2.80,-1.80,8.35],text:'木窗、砖拱和菱形石饰上方，是红色封檐板与逐排相搭的瓦。'}
]:[
  {key:'hall',name:'怀士堂',text:'朝向草坪的北立面，两座红砖塔楼夹着通高门廊。拉近可看见山墙上的菱形石饰和绿色琉璃嵌条。',height:12.8,look:6.6,eye:[6.4,-2.2,24.8]},
  {key:'lawn',name:'中区大草坪',text:'从草坪北端望向怀士堂，两侧的步道为红楼留出一条开阔的视线。',height:.25,look:2.5,eye:[15,34,41]},
  {key:'statue',name:'孙中山铜像',text:'铜像立于草坪北端，面向北方。绕至基座前，可以回望铜像身后的怀士堂。',height:4.6,look:3.48,eye:[-2.5,-1.48,5]},
  {key:'pavilion',name:'惺亭',text:'八角攒尖顶覆着蓝色琉璃瓦，亭中悬钟。沿着中轴线向南，即可望见孙中山铜像。',height:7,look:2.75,eye:[2.9,-.10,2.9]}
];
const scene = new T.Scene(), components = {};
const mats = {}, scratch = new T.Object3D();
const cube = new T.BoxGeometry(1,1,1), ball = new T.IcosahedronGeometry(1,0);
let seed=1924;
function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}
function range(a,b){return a+(b-a)*random()}
function choose(a){return a[Math.floor(random()*a.length)]}
function texture(draw,size=256){
  const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;return map;
}
// 周期噪声驱动颜色与高度两张图，砖缝、瓦脊的反光随视角改变。
const noiseTable=Float32Array.from({length:65536},()=>random());
const mix=(a,b,t)=>a+(b-a)*t;
const sat=x=>Math.max(0,Math.min(1,x));
function noise(x,y,period=256){
  const ix=Math.floor(x),iy=Math.floor(y),f=x-ix,g=y-iy;
  const at=(a,b)=>noiseTable[(((b%period+period)%period&255)<<8)|((a%period+period)%period&255)];
  return mix(mix(at(ix,iy),at(ix+1,iy),f*f*(3-2*f)),mix(at(ix,iy+1),at(ix+1,iy+1),f*f*(3-2*f)),g*g*(3-2*g));
}
// 自制样本经周期频谱合成的材料场。由它生成颜色、高度、粗糙度，不依赖图片文件。

function makeSurface(kind,size=512){
  // 庭院的砖与石在安装材质时会被替换。跳过无效绘图，同时保持其余构件的随机序列。
  if(COURT&&(kind==='brick'||kind==='stone')){
    let a=1664525,c=1013904223;
    for(let steps=size*size;steps;steps>>>=1){
      if(steps&1)seed=(Math.imul(a,seed)+c)>>>0;
      c=Math.imul(c,a+1)>>>0;a=Math.imul(a,a)>>>0;
    }
    return {map:new T.Texture(),normalMap:new T.Texture()};
  }
  const id=kind==='blue'?'tile':kind,field=MATERIAL_FIELDS[id]?Uint8Array.from(atob(MATERIAL_FIELDS[id]),c=>c.charCodeAt(0)):null;
  const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),im=ctx.createImageData(size,size),height=new Float32Array(size*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,i=y*size+x,g=random(),f=noise(u*64,v*64,64),m=noise(u*16,v*16,16),l=noise(u*4,v*4,4);
    let r,b,k,h;const grain=(g-.5)*17+(f-.5)*14+(m-.5)*11;
    if(kind==='brick'){
      let row=Math.floor(v*32),xx=u*14+(row%2)*.5,col=Math.floor(xx),ax=xx-col,ay=v*32-row;
      let edge=Math.min(Math.min(ax,1-ax)*2.3,ay,1-ay)+(f-.5)*.047;
      let body=sat((edge-.039)/.089),burn=.50+(noise(col*7.5,row*3.7)-.50)*.39;
      r=mix(163,145+burn*53,body)+grain*.72;k=mix(141,80+burn*43,body)+grain*.69;b=mix(117,57+burn*40,body)+grain*.68;
      h=body*.46+f*.085+g*.03;
    }else if(kind==='tile'||kind==='blue'){
      let q=(u*16)%1,a=(v*12+Math.floor(u*16)*.37)%1,rib=Math.pow(Math.max(0,Math.cos(q*Math.PI*2)),1.5);
      let wear=(m-.5)*13+(l-.5)*18,glaze=noise(Math.floor(u*16)*3,Math.floor(v*12)*7);
      r=45+rib*24+wear+grain*.44+glaze*12;k=73+rib*26+wear+grain*.49+glaze*17;b=62+rib*24+wear+grain*.51+glaze*13;
      let lip=(Math.exp(-Math.pow((a-.93)/.038,2))*18-Math.exp(-Math.pow((a-.025)/.046,2))*12)*(1-.37*rib);
      if(kind==='blue'){r=52+rib*19+wear+grain*.35;k=73+rib*22+wear+grain*.4;b=87+rib*23+wear+grain*.4}r-=lip;k-=lip;b-=lip;h=.24+rib*.45+(a>.9?-.15:0)+f*.035;
    }else if(kind==='stone'||kind==='paving'){
      let row=Math.floor(v*8),xx=u*5+(row%2)*.5,col=Math.floor(xx),ax=xx-col,ay=v*8-row;
      let body=sat((Math.min(ax,1-ax,ay,1-ay)-.004)*90),vein=Math.pow(sat(1-Math.abs(noise(u*34,v*27)-.51)*34),3)*6,age=(l-.5)*24+(m-.5)*13+noise(col*2,row*4)*13;
      r=mix(104,kind==='stone'?162:153,body)+age+grain+vein;k=r-(kind==='stone'?13:8);b=k-13;h=body*.65+f*.12+g*.08;
    }else if(kind==='glaze'){
      let xx=u*12,yy=v*12,ax=xx%1,ay=yy%1,d=Math.min(ax,1-ax,ay,1-ay),hole=Math.pow(Math.abs(ax-.5)+Math.abs(ay-.5),.8);
      let val=sat((hole-.24)*6)*sat(d*30);r=22+val*39+grain*.45;k=40+val*51+grain*.45;b=33+val*40+grain*.45;h=val*.76+f*.09;
    }else if(kind==='granite'){
      let quartz=Math.pow(g,14)*32,feldspar=(f-.5)*23+grain*.76+(m-.5)*18+(l-.5)*15;
      const mica=g>.945?-34:0,bloom=(l-.5)*7+(m-.5)*9;
      r=207+feldspar*.48+quartz*.70+mica+bloom;k=204+feldspar*.49+quartz*.73+mica+bloom;b=194+feldspar*.51+quartz*.77+mica+bloom;h=f*.23+g*.16;
    }else if(kind==='timber'){
      let warp=noise(u*8,v*3)*2.7,line=noise(u*128+warp,v*6,128),ray=Math.sin(u*420+warp*4)*.5+.5;
      let gr=(line-.5)*34+(m-.5)*14+grain*.44-7*Math.pow(ray,8);r=191+gr;k=173+gr;b=152+gr;h=line*.36+ray*.08+g*.04;
    }else if(kind==='bark'){
      let furrow=noise(u*64+noise(u*8,v*8,8)*3,v*8,64);r=71+furrow*49+(l-.5)*27+grain*.8;k=r-8;b=k-12;h=furrow*.78+f*.1;
    }else{
      let fleck=(g-.5)*31+(f-.5)*26+(m-.5)*19+(l-.5)*13;
      r=93+fleck;k=120+fleck*.94;b=60+fleck*.68;h=g*.4+f*.35;
    }
    if(field){
      const j=(Math.floor(v*320)*320+Math.floor(u*320))*3,cr=field[j]-128,cg=field[j+1]-128,cb=field[j+2]-128;
      const amp=({brick:.39,tile:.60,blue:.36,granite:.53,timber:.51})[kind];
      r+=cr*amp;k+=cg*amp;b+=cb*amp;h+=(cr*.26+cg*.58+cb*.16)*amp*.0039;
    }
    height[i]=h;im.data.set([r,k,b,255],4*i);
  }
  ctx.putImageData(im,0,0);
  if(kind==='grass'){
    for(let j=0;j<64000;j++){const x=range(0,size),y=range(0,size),a=1.1+noise(x/60,y/60)*2.3+range(-.86,.86),l=range(.7,3.2),light=random();
      ctx.strokeStyle=light>.62?'rgba(154,161,92,.36)':light<.21?'rgba(57,80,42,.32)':'rgba(103,130,65,.39)';ctx.lineWidth=range(.4,.94);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke()}
  }
  const nc=document.createElement('canvas');nc.width=nc.height=size;const nx=nc.getContext('2d'),nm=nx.createImageData(size,size);
  const strength=kind==='grass'?1.1:kind==='tile'?4:2.2;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x;
    const dx=(height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size])*strength,dy=(height[(y+1)%size*size+x]-height[(y+size-1)%size*size+x])*strength;
    const inv=1/Math.hypot(dx,dy,1);nm.data.set([128-127*dx*inv,128+127*dy*inv,128+127*inv,255],4*i);
  }nx.putImageData(nm,0,0);
  const maps=[c,nc].map(c=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t});maps[0].colorSpace=T.SRGBColorSpace;
  return {map:maps[0],normalMap:maps[1]};
}
function createMaterials(){
  const sod=fieldTexture(LIVE_FIELDS.grass);sod.wrapS=sod.wrapT=T.RepeatWrapping;sod.anisotropy=6;
  for(const key of ['plain','bronze','glass','bark','glaze','stone','brick','tile','grass','paving']){
    let mapped=!['plain','bronze','glass'].includes(key);
    mats[key]=new T.MeshStandardMaterial({...(mapped?makeSurface(key,key==='brick'?1024:512):{}),vertexColors:true,side:T.DoubleSide,roughness:({glass:.14,bronze:.45,glaze:.32,tile:.44})[key]||.9,metalness:({glass:.58,bronze:.71,glaze:.10,tile:.1})[key]||0,envMapIntensity:key==='glass'?1.15:.54});
    if(key==='grass'){
      mats[key].normalScale.setScalar(.12);
      mats[key].onBeforeCompile=shader=>{shader.uniforms.sodMap={value:sod};shader.fragmentShader='uniform sampler2D sodMap;\n'+shader.fragmentShader.replace('#include <map_fragment>',`
        vec2 p=vMapUv;vec4 a=texture2D(map,p);
        vec4 b=texture2D(map,mat2(.62,.79,-.79,.62)*p*.827+vec2(.41,.17));
        vec4 d=texture2D(map,mat2(.91,-.41,.41,.91)*p*1.73);
        float track=sin(p.x*12.4+p.y*.17+.17*sin(p.y*1.03));
        float mown=1.+(.029+.017*sin(p.y*.64+p.x*.38))*track+.018*sin(p.x*7.2+p.y*.34);
        float grassGrain=dot(texture2D(sodMap,p*.32+vec2(.18,.31)).rgb,vec3(.23,.63,.14));
        mown*=clamp(.90+grassGrain*.90,.90,1.18);
        float swale=.5+.5*sin(p.x*1.47+sin(p.y*.78))*cos(p.y*1.03+p.x*.31);
        float warp=sin(p.x*.88+sin(p.y*1.65)*.69)*cos(p.y*1.22+p.x*.41);
        float dry=smoothstep(.36,.99,swale)*.23+.077*smoothstep(.1,.74,warp);
        vec2 local=p*3.1;vec2 edge=abs(local-vec2(0.,${lawnShape.offset}))-vec2(${lawnShape.width/2-lawnShape.radius},${lawnShape.length/2-lawnShape.radius});
        float border=1.-smoothstep(.02,.60,abs(length(max(edge,0.))+min(max(edge.x,edge.y),0.)-${lawnShape.radius}));
        dry+=.095*border*(.50+.50*cos(p.y*2.3+p.x*3.7));
        diffuseColor.rgb*=mix(vec3(.98,1.02,.97),vec3(1.3,.95,.86),dry*2.18);
        vec3 blades=texture2D(sodMap,p*4.84).rgb,turned=texture2D(sodMap,mat2(.8,.6,-.6,.8)*p*3.27+vec2(.2,.71)).rgb;
        vec3 micro=mix(blades,turned,.29+.12*swale);
        vec3 broad=mix(mix(a.rgb,b.rgb,.45+.22*sin(p.x*1.09+p.y*.56)),d.rgb,.24);
        diffuseColor.rgb*=mix(broad,micro*vec3(1.13,1.08,1.34),.66)*mown;
        ${COURT?`float worn=smoothstep(.28,.88,border)*(.75+.25*sin(local.x*11.+local.y*5.));
        float shadePatch=clamp(.54+.25*sin(local.x*.77+sin(local.y*.83))+.21*sin(local.y*1.56+local.x*.61),0.,1.);
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.20,.86,.62),.22+.45*shadePatch);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.108,.078,.039),worn*(.19+.36*shadePatch));`:''}
      `)};
    }
  }
  const grain=makeSurface('granite',512),grainWood=makeSurface('timber',512);
  mats.greenCaps=new T.MeshStandardMaterial({map:mats.tile.map,vertexColors:true,side:T.DoubleSide,roughness:.55,metalness:.02,envMapIntensity:.55});
  mats.granite=new T.MeshStandardMaterial({...grain,vertexColors:true,roughness:.87,envMapIntensity:.24,side:T.DoubleSide});
  mats.granite.normalScale.setScalar(.22);
  mats.bell=castBellMaterial();
  mats.lacquer=new T.MeshStandardMaterial({vertexColors:true,roughness:.77,envMapIntensity:.24,normalMap:grainWood.normalMap});
  mats.lacquer.normalScale.setScalar(.075);
  mats.wood=new T.MeshStandardMaterial({...grainWood,vertexColors:true,roughness:.74,envMapIntensity:.29,side:T.DoubleSide});
  mats.castBronze=new T.MeshStandardMaterial({vertexColors:true,roughness:.57,metalness:.39,envMapIntensity:.70});
  mats.castBronze.onBeforeCompile=sh=>{
    sh.vertexShader='varying float bronzeY;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbronzeY=position.y-2.45;');
    sh.fragmentShader='varying float bronzeY;\n'+sh.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor+=.047-.16*(1.-smoothstep(.17,.26,bronzeY))-.09*smoothstep(1.91,1.99,bronzeY);')
       .replace('#include <opaque_fragment>','outgoingLight+=diffuseColor.rgb*(.13+.25*smoothstep(1.18,1.91,bronzeY))+vec3(.052,.045,.031)*pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.9)*smoothstep(.50,1.12,bronzeY);\n#include <opaque_fragment>');
  };
  const blue=makeSurface('blue',512);
  mats.blueTile=new T.MeshStandardMaterial({...blue,vertexColors:true,roughness:.37,metalness:.13,envMapIntensity:.74,side:T.DoubleSide});mats.blueTile.normalScale.setScalar(.47);
  mats.edgeGlaze=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,color:'#7c94a1',roughness:.45,metalness:.05});
  mats.palmSkin=palmBark();
  mats.palmLeaf=new T.MeshLambertMaterial({vertexColors:true,emissive:0x27331d,side:T.FrontSide});
  mats.shrub=new T.MeshLambertMaterial({vertexColors:true,side:T.FrontSide,emissive:0x25361b});
  mats.glass.roughness=.16;mats.glass.metalness=.63;
  banyanMaterials();
  mats.frond=new T.MeshLambertMaterial({map:fieldTexture(FROND_DATA),alphaTest:.33,vertexColors:true,side:T.DoubleSide,emissive:0x273622});mats.frond.onBeforeCompile=translucentLeaf;mats.frond.emissive.setHex(0xaaa990);mats.frond.emissiveMap=mats.frond.map;
}
// 在透明画布中长出有茎、有叶脉的末级枝组；树冠由这些枝叶片在三维空间交叠形成。

function skyMap(isMorning){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d'),im=ctx.createImageData(c.width,c.height);
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const lat=(.5-y/c.height)*Math.PI,a=(x/c.width-.5)*2*Math.PI,e=Math.max(0,Math.sin(lat)),nx=Math.cos(a)*Math.cos(lat),nz=Math.sin(a)*Math.cos(lat);
    const t=Math.pow(e,.53),den=.11+e,px=nx*2.1/den+53,pz=nz*2.1/den+60;
    const wx=noise(px*.53,pz*.71)*2.7,wz=noise(px*.62+17,pz*.58)*1.9,cx=px+wx,cz=pz+wz;
    const n=noise(cx*.95,cz*1.45)*.47+noise(cx*2.6,cz*2.1)*.25+noise(cx*5.3,cz*4.3)*.15+noise(cx*10.6,cz*8.6)*.08+noise(cx*21.2,cz*17.2)*.05;
    let cloud=sat((n-.53)*3.15)*.50*sat(e*11);
    let horizon=isMorning?[217,224,219]:[228,224,202],zenith=isMorning?[103,155,176]:[67,131,171];
    const glow=Math.pow(Math.max(0,(-nx*.62+e*.49+nz*.61)),18);
    for(let k=0;k<3;k++)im.data[(y*1024+x)*4+k]=mix(mix(horizon[k],zenith[k],t),[248,242,224][k],cloud)+glow*[27,20,9][k];im.data[(y*1024+x)*4+3]=255;
  }
  ctx.putImageData(im,0,0);const tex=new T.CanvasTexture(c);tex.mapping=T.EquirectangularReflectionMapping;tex.colorSpace=T.SRGBColorSpace;return tex;
}

// 在每个组件内部按材质合并静态网格，使窗棂、瓦面和枝叶都能保留独立的建模逻辑。
const edgeCache=new Map();
class Part{
  constructor(name){this.name=name;this.bins=new Map()}
  add(geometry,color,pos=[0,0,0],size=[1,1,1],rot=[0,0,0],material='plain'){
    if(material==='plain'&&(color===stone||color===trim||color==='#c3b79e'||color==='#cbbfa5')){material='granite';color='#ddd3bf'}
    if(material==='plain'&&color===glass){material='glass';color='#89938e'}
    const g=geometry.index?geometry.toNonIndexed():geometry.clone();
    scratch.position.set(...pos);scratch.scale.set(...size);scratch.rotation.set(...rot);scratch.updateMatrix();g.applyMatrix4(scratch.matrix);
    const p=g.attributes.position,n=g.attributes.normal,col=new T.Color(color),colors=new Float32Array(p.count*3),uv=new Float32Array(p.count*2);
    for(let i=0;i<p.count;i++){
      let stain=1;
      if(material==='granite')stain=.98+.044*noise(p.getX(i)*2.6+p.getZ(i),p.getY(i)*3.4)-.045*Math.exp(-7*Math.max(0,p.getY(i)-.08));
      colors.set([col.r*stain,col.g*stain,col.b*stain],i*3);
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      if(material==='bell'&&geometry.attributes.uv){uv[i*2]=g.attributes.uv.getX(i);uv[i*2+1]=g.attributes.uv.getY(i)}
      else if((material==='wood'||material==='lacquer')&&geometry.attributes.uv){uv[i*2]=g.attributes.uv.getX(i)*1.8;uv[i*2+1]=g.attributes.uv.getY(i)*1.25}
      else if(['brick','stone','glaze','bark','granite','wood'].includes(material)&&Math.abs(n.getY(i))<.7){const d=material==='glaze'?.63:material==='granite'?1.1:3.3;uv[i*2]=(Math.abs(n.getX(i))>.65?z:x)/d;uv[i*2+1]=y/d}
      else if(material==='tile'){uv[i*2]=(Math.abs(n.getX(i))>Math.abs(n.getZ(i))?z:x)/3.1;uv[i*2+1]=(y+z*.12)/2}
      else {const denom=material==='granite'?.89:material==='grass'?3.1:material==='paving'?4.4:3.3;uv[i*2]=x/denom;uv[i*2+1]=z/denom}
    }
    g.setAttribute('color',new T.BufferAttribute(colors,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));
    if(!this.bins.has(material))this.bins.set(material,[]);this.bins.get(material).push(g);
  }
  box(x,y,z,w,h,d,color,mat='plain',rot=[0,0,0]){
    if(((COURT&&mat==='lacquer')||mat==='granite'||mat==='stone'||mat==='wood'||color===trim||color===stone)&&Math.min(w,h,d)>.055){
      const key=[w,h,d].join('/');let g=edgeCache.get(key);
      if(!g){g=new CampusTools.RoundedBoxGeometry(w,h,d,1,Math.min(.029,Math.min(w,h,d)*.14));edgeCache.set(key,g)}
      this.add(g,color,[x,y,z],[1,1,1],rot,mat);
    }else this.add(cube,color,[x,y,z],[w,h,d],rot,mat)
  }
  rod(a,b,r1,r2,color,sides=7,material='plain'){
    const v=new T.Vector3(...a),u=new T.Vector3(...b),d=u.clone().sub(v);
    const g=new T.CylinderGeometry(r2,r1,d.length(),sides);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));
    this.add(g,color,v.lerp(u,.5).toArray(),[1,1,1],[0,0,0],material);g.dispose();
  }
  surface(vertices,color,mat='plain'){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices.flat(),3));g.computeVertexNormals();this.add(g,color,[0,0,0],[1,1,1],[0,0,0],mat);g.dispose()}
  finish(){const group=new T.Group();group.name=this.name;
    for(const [key,geos] of this.bins){const mesh=new T.Mesh(mergeGeometries(geos),mats[key]);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);geos.forEach(g=>g.dispose())}
    return group;
  }
}
// 双坡和四坡共用这副筒瓦截面。瓦从檐口向脊顶逐排搭接，边缝在釉色与剪影中都可见。
function tileSlope(p,A,B,C,D,kind='greenCaps'){
  const a=v3(...A),b=v3(...B),c=v3(...C),d=v3(...D),across=b.clone().sub(a).normalize();
  const width=a.distanceTo(b),u1=c.clone().sub(a).dot(across),u2=d.clone().sub(a).dot(across);
  const peak=c.clone().sub(a).addScaledVector(across,-u1),height=peak.length();
  if(height<.1)return;
  const up=new T.Vector3().crossVectors(across,peak).normalize();if(up.y<0)up.negate();
  const count=Math.ceil(width/.205),step=width/count,rows=Math.ceil(height/.295);
  const v=[],uv=[],colors=[],index=[],arc=6;
  for(let i=0;i<count;i++){const x=(i+.5)*step;
    let top=1;if(u1>.01&&x<u1)top=x/u1;if(u2<width-.01&&x>u2)top=(width-x)/(width-u2);
    for(let j=0;j<rows*top;j++){
      const lo=j/rows,hi=Math.min(top,(j+1.075)/rows),base=v.length/3;
      const age=noise(i*.7,j*1.75),v1=.85+.23*age,c0=new T.Color().setRGB(2.26+.48*age,1.95+.53*age,1.94+.50*age);
      for(let e=0;e<2;e++)for(let k=0;k<=arc;k++){
        const t=e?hi:lo,phase=k*Math.PI/arc,rad=(e?.064:.075)*step/.205;
        const P=a.clone().addScaledVector(across,x+rad*Math.cos(phase)).addScaledVector(peak,t).addScaledVector(up,.017+rad*Math.sin(phase)+(e?0:.011));
        v.push(P.x,P.y,P.z);uv.push((i*.731+k/arc*.22)%1,(j*.38+e*.2)%1);
        const shade=v1*(.79+.21*Math.sin(phase));colors.push(c0.r*shade,c0.g*shade,c0.b*shade);
        if(e&&k){let n=base+e*(arc+1)+k;index.push(n-arc-2,n-1,n,n-arc-2,n,n-arc-1)}
      }
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
  if(!p.bins.has(kind))p.bins.set(kind,[]);p.bins.get(kind).push(geo.toNonIndexed());geo.dispose();
}
// 门楣上的灰石、拱券和通廊柱头，以北立面公开照片中能辨认的构件为依据。
function entranceMasonry(p){
  const z=3.76;
  for(const side of [-1,1]){
    p.box(side*1.85,4.05,z,COURT?.68:.79,COURT?.89:.86,.074,'#a9a79b','granite');
    for(const s of [-1,1])p.box(side*1.85+s*(COURT?.36:.428),4.055,z+.014,.052,.97,.073,COURT?'#ac795b':'#b18b6b');
    for(const x of [-1.48,1.48]){
      const outline=new T.Shape();outline.moveTo(0,0);outline.lineTo(.09,0);outline.quadraticCurveTo(.14,.22,.29,.22);outline.quadraticCurveTo(.43,.23,.48,.36);outline.lineTo(.64,.37);outline.lineTo(.64,.53);outline.lineTo(0,.53);outline.closePath();
      const corbel=new T.ExtrudeGeometry(outline,{depth:.36,bevelEnabled:true,bevelThickness:.014,bevelSize:.014,curveSegments:6});corbel.translate(0,0,-.18);
      p.add(corbel,'#b6a58a',[x+side*.205,7.01,6.32],[1,1,1],[0,side<0?Math.PI:0,0],'granite');corbel.dispose();
    }
  }
  const tympanum=new T.Shape();tympanum.moveTo(-.685,0);tympanum.absarc(0,0,.685,Math.PI,0,true);tympanum.closePath();
  const infill=new T.ExtrudeGeometry(tympanum,{depth:.084,bevelEnabled:false,curveSegments:24});p.add(infill,'#b5b6a8',[0,3.63,z-.01],[1,1,1],[0,0,0],'granite');infill.dispose();
  p.rod([0,3.93,z+.078],[0,3.93,z+.110],.184,.184,'#68887a',36);p.rod([0,3.93,z+.111],[0,3.93,z+.126],.154,.154,'#eeeae0',48);
  const ring=new T.TorusGeometry(.112,.006,6,48);p.add(ring,'#a0a398',[0,3.93,z+.137]);ring.dispose();
  for(const s of [-1,1])p.surface([[0,3.88,z+.141],[s*.071,3.949,z+.141],[s*.028,3.968,z+.141]],'#8a978e');

  p.box(0,3.63,z+.028,1.47,.068,.151,'#8d8977','granite');
  // 塔楼的外披檐是压暗的灰绿色包边，檐下一条窄亮面接住天光。
  for(const x of [-5.35,5.35])for(const s of [-1,1]){
    const A=[x,12.84,7.12],B=[x+s*2.84,10.95,7.12],a=[x,12.72,7.14],b=[x+s*2.84,10.81,7.14];
    p.surface([A,B,b,A,b,a],'#494e49');p.rod(A,B,.037,.037,'#72827b',7);
  }
}

function hip(p,x,y,z,w,d,h,ridge,mat='tile',color='#ffffff'){
  const a=[x-w/2,y,z+d/2],b=[x+w/2,y,z+d/2],c=[x+w/2,y,z-d/2],e=[x-w/2,y,z-d/2],l=[x-ridge/2,y+h,z],r=[x+ridge/2,y+h,z];
  p.surface([a,b,r,a,r,l,b,c,r,c,e,l,c,l,r,e,a,l],color,mat);
  if(p.name==='怀士堂'){
    for(const [A,B,C,D] of [[a,b,l,r],[c,e,r,l],[b,c,r,r],[e,a,l,l]])tileSlope(p,A,B,C,D);
  }
  p.box(x,y-.09,z,w,.19,d,COURT&&p.name==='怀士堂'?'#726658':'#cbbf98');p.rod(l,r,.12,.12,'#496d59');
  for(const [v,t] of [[a,l],[b,r],[c,r],[e,l]])p.rod(v,t,.095,.1,'#699078');
}
function gable(p,x,y,z,w,d,h){
  const a=[x-w/2,y,z+d/2],b=[x+w/2,y,z+d/2],c=[x,y+h,z+d/2],v=[x-w/2,y,z-d/2],q=[x+w/2,y,z-d/2],r=[x,y+h,z-d/2];
  p.surface([a,c,r,a,r,v,c,b,q,c,q,r],'#ffffff','tile');tileSlope(p,a,v,c,r);tileSlope(p,q,b,r,c);
  for(const dz of [-1,1]){let zz=z+dz*(d/2-.4);p.surface([[x-w/2+.45,y-.03,zz],[x+w/2-.45,y-.03,zz],[x,y+h-.18,zz]],'#ffffff','brick')}
  for(const [i,j] of [[a,c],[b,c],[v,r],[q,r]])p.rod(i,j,COURT?.074:.13,COURT?.074:.13,COURT?'#794c40':'#e5d7ae',4);
  p.rod(c,r,.13,.13,'#579075');
}
const stone='#c3b69c',trim='#d6c6a8',green='#477c67',glass='#354d4b',frame='#453e34';
function windowBay(p,x,y,z,w,h,arched=false,sign=1){
  const zz=d=>z+sign*d,wood='#473f32',edge='#796551',sill='#c2ad91';
  p.box(x,y,zz(.047),w+.20,h+.13,.14,'#382f28');
  for(const side of [-1,1])p.box(x+side*(w*.5+.064),y,zz(.102),.075,h+.12,.17,'#9d7c60');
  p.box(x,y,zz(.057),w+.15,h+.1,.11,'#493b31');p.box(x,y,zz(.126),w*.94,h*.99,.05,'#41544c','glass');
  for(const s of [-1,1]){
    p.box(x+s*w*.51,y,zz(.165),.074,h+.12,.23,edge);
    p.box(x+s*w*.465,y,zz(.18),.046,h,.095,wood);
    p.box(x+s*w*.245,y,zz(.19),.025,h,.063,wood);
  }
  p.box(x,y,zz(.2),.05,h,.078,wood);
  for(const v of [-.49,-.23,0,.23,.49])p.box(x,y+h*v,zz(.203),w,.037,.071,wood);
  p.box(x,y-h*.52,zz(.18),w+.27,.13,.38,sill);p.box(x,y-h*.57,zz(.14),w+.15,.055,.25,'#897b68');
  if(arched){
    let vv=[];for(let j=0;j<18;j++){const a=j*Math.PI/18,b=(j+1)*Math.PI/18;vv.push([x,y+h*.5,zz(.111)],[x+Math.cos(a)*w*.5,y+h*.5+Math.sin(a)*w*.5,zz(.111)],[x+Math.cos(b)*w*.5,y+h*.5+Math.sin(b)*w*.5,zz(.111)])}
    p.surface(vv,'#384a42','glass');if(sign===1)archBlocks(p,x,y+h*.49,zz(.19),w*.51,w*.655,0,Math.PI,19);
    for(const a of [.23,.39,.61,.77])p.rod([x,y+h*.5,zz(.19)],[x+Math.cos(a*Math.PI)*w*.49,y+h*.5+Math.sin(a*Math.PI)*w*.49,zz(.19)],.012,.012,wood,5);
  }else{p.box(x,y+h*.52,zz(.12),w+.21,.12,.24,'#aa8064');for(let j=0;j<9;j++)p.box(x+((j+.5)/9-.5)*(w+.17),y+h*.55,zz(.26),w*.098,.17,.075,choose(['#a77254','#b7805e','#ac7556']))}
}
function platformRails(p,a,b,y,count){
  const A=v3(a[0],y,a[1]),B=v3(b[0],y,b[1]),len=A.distanceTo(B),axis=Math.atan2(b[0]-a[0],b[1]-a[1]);
  const along=(t,dy,w,h,d,col)=>{const m=A.clone().lerp(B,t);p.box(m.x,y+dy,m.z,w,h,d,col,'granite',[0,axis,0])};
  along(.5,.15,.17,.26,len,'#d1c5ac');along(.5,.64,.17,.10,len,'#e0d4bb');
  for(let i=0;i<=count;i++){const v=A.clone().lerp(B,i/count);p.box(v.x,y+.405,v.z,.24,.81,.24,'#d8cdb3','granite');p.box(v.x,y+.78,v.z,.29,.072,.29,'#daceb8','granite');
    const cap=new T.LatheGeometry([[.02,0],[.116,.006],[.13,.043],[.114,.104],[.086,.133],[.05,.148],[.008,.151]].map(([r,h])=>new T.Vector2(r,h)),20);p.add(cap,'#e0d3bb',[v.x,y+.81,v.z],[1,1,1],[0,0,0],'granite');cap.dispose()}
  for(let i=0;i<count;i++){const span=len/count;for(const t of [.22,.5,.78])along((i+t)/count,.41,.084,.35,.09,'#cbbfa6');
    along((i+.5)/count,.43,.075,.045,span-.14,'#d5c8ad')}
}
// 瓦当的中心、莲瓣、外圈与滴水片有独立截面；飞檐使用连续曲线收口。
function eaveTile(p,at,a,scale=1){
  const A=v3(Math.cos(a),-.11,Math.sin(a)).normalize(),U=v3(-Math.sin(a),0,Math.cos(a)),V=new T.Vector3().crossVectors(A,U).normalize().negate();
  const P=(u,v,d)=>v3(...at).addScaledVector(U,u*scale).addScaledVector(V,v*scale).addScaledVector(A,d*scale).toArray();
  for(const [lo,hi,r0,r1,c] of [[-.09,-.012,.073,.071,'#485863'],[-.012,.005,.071,.065,'#77858a'],[.005,.011,.057,.052,'#586a78']])p.rod(P(0,0,lo),P(0,0,hi),r0*scale,r1*scale,new T.Color(c).multiplyScalar(range(.83,1.04)),22);
  for(let k=0;k<6;k++){let t=k*Math.PI/3,c=Math.cos(t),s=Math.sin(t);
    p.surface([P(c*.012,s*.012,.014),P(c*.031-s*.009,s*.031+c*.009,.013),P(c*.049,s*.049,.014),P(c*.012,s*.012,.014),P(c*.049,s*.049,.014),P(c*.032+s*.008,s*.032-c*.008,.017)],choose(['#657883','#6f8088','#657b88','#6a7b86']));
  }
  p.rod(P(0,0,.009),P(0,0,.016),.011*scale,.009*scale,'#738490',12);
  const l=P(.061,-.018,-.034),r=P(.159,-.018,-.034),b=P(.112,-.096,-.024),c=P(.111,-.028,-.001);
  p.surface([l,c,b,c,r,b],choose(['#536b7a','#536978','#617889','#566e80']));
}
// 钟面用宽展的环向坐标。颜色、铸造粗糙度和阳文各自计算，磨亮处只出现在纹样高点。
function castBellMaterial(){
  const w=1024,h=512,c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d'),im=ctx.createImageData(w,h),rel=document.createElement('canvas');rel.width=w;rel.height=h;
  const dc=rel.getContext('2d');dc.fillStyle='#161616';dc.fillRect(0,0,w,h);
  // 钟腹只刻连续的浅浮雕装饰带，保留空白铜面及自然氧化。
  for(const y of [195,252]){
    for(const off of [-4,4]){dc.strokeStyle='#b2b2b2';dc.lineWidth=2.8;dc.beginPath();dc.moveTo(0,y+off);dc.lineTo(w,y+off);dc.stroke()}
  }
  for(let j=-1;j<=32;j++){
    const x=j*w/32;dc.strokeStyle='#a8a8a8';dc.lineWidth=2.8;dc.beginPath();dc.moveTo(x-15,225);
    dc.quadraticCurveTo(x-6,224,x,207);dc.quadraticCurveTo(x+6,224,x+15,225);
    dc.quadraticCurveTo(x+5,227,x,242);dc.quadraticCurveTo(x-5,227,x-15,225);dc.stroke();
    dc.beginPath();dc.ellipse(x,225,2.2,5,0,0,Math.PI*2);dc.fillStyle='#c4c4c4';dc.fill();
  }
  const mark=dc.getImageData(0,0,w,h),bump=dc.createImageData(w,h),rough=dc.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const u=x/w,v=y/h,i=(x+y*w)*4,coarse=noise(u*12,v*8,12),salt=noise(u*54,v*35),grit=random(),run=noise(u*49+coarse*3,v*6),relief=mark.data[i]/255;
    const oxide=T.MathUtils.smoothstep(coarse*.46+salt*.27+run*.27,.42,.69),bright=(grit-.5)*17+(salt-.5)*20+relief*39;
    im.data.set([116-oxide*20+bright,107+oxide*5+bright,79+oxide*16+bright,255],i);
    let b=57+relief*154+(grit-.5)*20+(run-.5)*28,rr=130+oxide*61+(salt-.5)*15-relief*21;bump.data.set([b,b,b,255],i);rough.data.set([rr,rr,rr,255],i);
  }
  ctx.putImageData(im,0,0);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  dc.putImageData(bump,0,0);const b=new T.CanvasTexture(rel),rc=document.createElement('canvas');rc.width=w;rc.height=h;rc.getContext('2d').putImageData(rough,0,0);const r=new T.CanvasTexture(rc);
  for(const m of [map,b,r]){m.wrapS=T.RepeatWrapping;m.anisotropy=4}
  return new T.MeshStandardMaterial({map,bumpMap:b,bumpScale:.014,roughnessMap:r,roughness:.95,metalness:.53,envMapIntensity:.78,vertexColors:true,side:T.DoubleSide});
}
function ridgeEnd(p,P,a){
  const A=v3(Math.cos(a),0,Math.sin(a)),S=v3(-Math.sin(a),0,Math.cos(a)),at=(x,y,z)=>v3(...P).addScaledVector(A,x).addScaledVector(S,z).add(v3(0,y,0)).toArray();
  const profile=[[-.11,.018,.072,.055],[-.04,.031,.086,.071],[.036,.047,.082,.082],[.096,.079,.067,.069],[.128,.116,.046,.055],[.119,.149,.029,.029],[.101,.152,.015,.015]];
  const g=new T.BufferGeometry(),pts=[],idx=[],col=[],uv=[];
  for(let j=0;j<profile.length;j++)for(let k=0;k<=20;k++){
    const [x,y,w,h]=profile[j],t=k*Math.PI/10,d=.94+.06*Math.cos(t*5);
    pts.push(...at(x,y+Math.sin(t)*h,Math.cos(t)*w*d));const light=.70+.16*Math.sin(t)+.10*j/6;col.push(light*.81,light*.88,light);uv.push(k/20,j/6);
    if(j&&k){const i=j*21+k;idx.push(i-22,i-21,i,i-22,i,i-1)}
  }
  g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  if(!p.bins.has('edgeGlaze'))p.bins.set('edgeGlaze',[]);p.bins.get('edgeGlaze').push(g.toNonIndexed());g.dispose();
}

// 脊瓦共用连续的鞍形截面；搭接处略微加厚，不在相邻两片之间留下黑色端面。
function saddleRidge(p,point){
  const verts=[],uv=[],colors=[],idx=[],rows=150,arc=16;
  for(let j=0;j<=rows;j++){
    const t=j/rows,C=v3(...point(t,1,.052)),A=v3(...point(Math.max(0,t-.007),1,.052)),B=v3(...point(Math.min(1,t+.007),1,.052)),tangent=B.sub(A).normalize();
    const side=new T.Vector3().crossVectors(tangent,v3(0,1,0)).normalize(),up=new T.Vector3().crossVectors(side,tangent).normalize();
    const cycle=(t*15+.31)%1,lip=.004*Math.exp(-Math.pow((cycle-.11)/.085,2)),width=.076-.021*t+lip,h=.058-.014*t+lip;
    for(let k=0;k<=arc;k++){
      let a=k*Math.PI/arc,q=C.clone().addScaledVector(side,Math.cos(a)*width).addScaledVector(up,Math.sin(a)*h);
      const hue=.82+.10*noise(t*19,k*.34)+.025*Math.sin(t*90)*Math.sin(a);verts.push(q.x,q.y,q.z);colors.push(hue*.82,hue*.91,hue);
      uv.push(k/arc,t*2);if(j&&k){let i=j*(arc+1)+k;idx.push(i-arc-2,i-1,i,i-arc-2,i,i-arc-1)}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  if(!p.bins.has('edgeGlaze'))p.bins.set('edgeGlaze',[]);p.bins.get('edgeGlaze').push(g.toNonIndexed());g.dispose();
}

function roofPavilion(p){
  const radius=3.32,apothem=radius*Math.cos(Math.PI/8),half=radius*Math.sin(Math.PI/8);
  for(let f=0;f<8;f++){
    const a=(f+1)*Math.PI/4,cs=Math.cos(a),sn=Math.sin(a);
    function pos(t,u,extra=0){
      const r=apothem*(1-t),x=u*half*(1-t),corner=Math.pow(Math.abs(u),4);
      const y=4.38+2.17*(.55*t+.45*t*t)+.34*corner*(1-t)**3+extra;
      return [cs*r-sn*x,y,sn*r+cs*x];
    }
    const vs=[],cols=[],uv=[],ids=[],slices=68,rows=32;
    for(let j=0;j<=rows;j++)for(let k=0;k<=slices;k++){
      const t=j/rows,u=k/slices*2-1,xx=(u*half*(1-t)+half)/.138;
      const rib=.055*(.5+.5*Math.cos(xx*Math.PI*2))**2,lap=j%3===0?.022:0,out=pos(t,u,rib+lap);
      vs.push(...out);let c=new T.Color('#c2d0e0'),v=.89+.18*noise(xx*.63,t*17)+lap*2;cols.push(c.r*v,c.g*v,c.b*v);uv.push(xx/16,t*1.32);
      if(j&&k){let d=j*(slices+1)+k;ids.push(d-slices-2,d-slices-1,d,d-slices-2,d,d-1)}
    }
    let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();
    if(!p.bins.has('blueTile'))p.bins.set('blueTile',[]);p.bins.get('blueTile').push(g.toNonIndexed());g.dispose();
    for(let j=0;j<19;j++){const u=(j+.5)/19*2-1,b=pos(0,u),h=pos(.035,u);
      eaveTile(p,b,a,range(.73,.86));}

    saddleRidge(p,pos);
    ridgeEnd(p,pos(0,1,.048),a+Math.PI/8);
    // 连续望板与封檐板沿翘曲的实边逐段闭合；柱间穿枋承担屋盖。
    for(let k=0;k<24;k++){
      const u=k/12-1,un=(k+1)/12-1,e1=pos(0,u,-.027),e2=pos(0,un,-.027),b1=pos(0,u,-.145),b2=pos(0,un,-.145);
      const inside=q=>{let h=pos(.36,q);h[1]=4.045+.023*Math.abs(q);return h};
      const i1=inside(u),i2=inside(un);
      const lip=t=>[Math.cos(a)*2.08-Math.sin(a)*t*2.08*Math.tan(Math.PI/8),4.02,Math.sin(a)*2.08+Math.cos(a)*t*2.08*Math.tan(Math.PI/8)];
      p.surface([i1,i2,lip(un),i1,lip(un),lip(u)],'#937347','wood');
      const wood=choose(['#bf924e','#aa8142','#b38a4d','#b68f55']);
      p.surface([e1,e2,b2,e1,b2,b1],'#576477');p.surface([b1,b2,i2,b1,i2,i1],wood,'wood');
      p.surface([i1,i2,[0,4.055,0]],'#93765b','wood');
      if(k%3===0){const A=i1.slice(),B=b1.slice();A[1]-=.032;B[1]-=.033;
        p.rod(A,B,.034,.030,'#bc914f',6,'wood');p.rod(B,b1,.031,.030,'#ba945b',8,'wood')}
      if(k%3===0)p.rod(i1,b1,.012,.012,'#76624d',5,'wood');
      p.rod(b1,b2,.027,.027,'#946e39',7);
    }
    const aa=a-Math.PI/8,bb=a+Math.PI/8;
    const beam=(t,y)=>[Math.cos(t)*2.28,y,Math.sin(t)*2.28];
    p.rod(beam(aa,3.99),beam(bb,3.99),.19,.19,'#a14a3e',4,'wood');
    p.rod(beam(aa,4.14),beam(bb,4.14),.22,.22,'#995043',4,'wood');
    for(let j=0;j<9;j++){const u=-1+(j+.5)*2/9,root=pos(.19,u,-.235),end=pos(.035,u,-.125);p.rod(root,end,.033,.041,'#896e4a',10)}
    const x=cs*2.14,z=sn*2.14;
    for(let j=0;j<3;j++){const y=3.85+j*.107;let w=.35+j*.19;p.box(x,y,z,w,.12,.22,'#b78139','wood',[0,Math.PI*.5-a,0])}
  }
}
function shrubLeaves(p,x,y,z,r){
  // 小叶直接生成双折面，避免近景灌木出现球粒外壳。
  const data=[],cols=[],norm=[],uv=[];
  for(let t=0;t<3;t++){const a=t*2.399,xo=Math.sin(a)*r*.24,zo=Math.cos(a)*r*.24;
    const g=new T.SphereGeometry(1,23,15),ps=g.attributes.position;
    for(let i=0;i<ps.count;i++){const vx=ps.getX(i),vy=ps.getY(i),vz=ps.getZ(i),j=1+.08*Math.sin(8*vx+9*vy)*Math.cos(9*vz+3*t);
      ps.setXYZ(i,vx*j,vy*j,vz*j)}g.computeVertexNormals();
    p.add(g,choose(['#5d7546','#587045','#617b49']),[x+xo,y-.025*r,z+zo],[r*.64,r*.56,r*.62],[0,a,0],'shrub');g.dispose();
  }
  for(let i=0;i<1180;i++){
    let a=i*2.399+range(-.18,.18),e=range(-.63,1),cs=Math.sqrt(1-e*e),rr=r*(.66+.34*Math.sqrt(random()));
    const c=v3(x+Math.cos(a)*cs*rr,y+e*rr*.69,z+Math.sin(a)*cs*rr),l=r*range(.07,.16),d=v3(Math.cos(a),range(-.3,.75),Math.sin(a)).normalize(),ac=v3(-Math.sin(a),.06,Math.cos(a));
    const col=new T.Color(choose(['#779054','#72894a','#607e46','#7f9254','#658149'])).multiplyScalar(.83+.24*(e+.4));
    let base=c.clone().addScaledVector(d,-l*.3),tip=c.clone().addScaledVector(d,l),left=c.clone().addScaledVector(ac,l*.32),right=c.clone().addScaledVector(ac,-l*.32);
    for(const v of [base,tip,left,base,right,tip,left,tip,base,tip,right,base]){data.push(...v.toArray());cols.push(col.r,col.g,col.b);norm.push(cs*Math.cos(a)*.6,.77,cs*Math.sin(a)*.6);uv.push(0,0)}
  }
  const g=new T.BufferGeometry();for(const [name,arr,size] of [['position',data,3],['color',cols,3],['normal',norm,3],['uv',uv,2]])g.setAttribute(name,new T.Float32BufferAttribute(arr,size));
  if(!p.bins.has('shrub'))p.bins.set('shrub',[]);p.bins.get('shrub').push(g);
}
// 从校园本身采样六个方向的反射，窗玻璃可映出树列与天空。
function reflectionProbe(baked){
  function capture(size,eye,near){
    const rt=new T.WebGLCubeRenderTarget(size,{generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter,type:T.HalfFloatType});
    const probe=new T.CubeCamera(near,size===128?250:140,rt);probe.position.set(...eye);probe.update(renderer,scene);return rt.texture;
  }
  const outside=baked?.outside||capture(128,[.5,4.2,-17],.2);
  const glassShader=mats.glass;
  glassShader.onBeforeCompile=shader=>{
    shader.uniforms.campusReflection={value:outside};
    shader.vertexShader='varying vec3 glassWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n glassWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader='varying vec3 glassWorld;uniform samplerCube campusReflection;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec3 W=glassWorld,V=normalize(W-cameraPosition);
      vec3 N=normalize(cross(dFdx(W),dFdy(W)));if(dot(N,V)>0.)N=-N;
      vec3 R=reflect(V,N), probe=vec3(.5,4.2,-17.);vec3 ray=normalize(W+R*27.-probe);
      vec3 reflected=textureCube(campusReflection,ray).rgb*${baked?.outside?'4.0':'1.0'};
      float facing=clamp(dot(-V,N),0.,1.),fresnel=.17+.50*pow(1.-facing,3.);
      vec3 windowAxis=normalize(cross(vec3(0.,1.,0.),N));float across=dot(W,windowAxis);
      float insideX=across+.72*dot(V,windowAxis)/max(.26,facing),insideY=W.y+.72*V.y/max(.26,facing);
      float curtain=smoothstep(.09,.32,fract(insideX*.77+.1*sin(floor(W.y*.46))))*(1.-smoothstep(.69,.82,fract(insideX*.77)));
      float fold=.5+.5*cos(insideX*31.);
      float high=clamp((R.y+.07)*2.0,0.,1.);
      float rip=.5+.5*sin(W.y*6.+sin(W.x*4.7));
      float room=fract(sin(dot(floor(W.xz*.57)+floor(W.y*.39),vec2(23.17,17.19)))*2384.35);
      float pane=.5+.5*sin(floor(W.x*3.0)*1.73+floor(W.y*2.9)*.83+floor(W.z*3.0)*1.35);
      vec3 interior=mix(vec3(.010,.016,.018),vec3(.042,.047,.037),room)*(.91+.16*pane);
      vec3 glint=mix(vec3(.034,.052,.042),vec3(.17,.24,.27),high);
      float porch=(1.-smoothstep(2.4,3.5,abs(W.x)))*(1.-smoothstep(.31,1.,abs(W.z+${COURT?27.40:24.46})));
      outgoingLight=(interior*.57+vec3(.085,.080,.063)*curtain*(.50+.50*fold)*smoothstep(.2,.77,room)+glint*.24+min(reflected,vec3(1.8))*(fresnel+.15*rip))*mix(1.,${COURT?.34:.50},porch)*(.88+.18*pane);
      #include <opaque_fragment>`);
  };glassShader.needsUpdate=true;
  if(COURT){
    doorReflection(baked?.entrance||capture(256,[.1,3.2,-23.65],.12),baked?.entrance?4:1);
  }
}

function steps(p,x,z,w,n,sign=1){for(let i=0;i<n;i++){let h=(n-i)*.19;p.box(x,h/2,z+sign*i*.34,w,h,.38,stone)}}
function archBlocks(p,x,y,z,inner,outer,from=0,to=Math.PI,count=17){
  for(let i=0;i<count;i++){
    const a=mix(from,to,(i+.045)/count),b=mix(from,to,(i+.955)/count);
    const at=(t,r,zz)=>[x+r*Math.cos(t),y+r*Math.sin(t),zz];
    const h=outer+(i===Math.floor(count/2)?.045:0),v=[at(a,inner,z),at(b,inner,z),at(b,h,z),at(a,h,z)];
    p.surface([v[0],v[1],v[2],v[0],v[2],v[3]],choose(['#b38665','#a77557','#c19675','#a77e61']));
    p.surface([v[0],at(a,inner,z-.06),at(b,inner,z-.06),v[0],at(b,inner,z-.06),v[1]],'#775740');
  }
}
function hallCarving(p){
  for(const s of [-1,1]){
    const x=s*5.35;
    for(const xx of [x-1.74,x+1.74])for(const [lo,hi] of [[1.7,3],[3.25,7],[7.28,9.45],[9.68,10.45]]){
      p.box(xx,(lo+hi)/2,6.58,.42,hi-lo,.08,'#fff','glaze');
      for(const a of [-1,1])p.box(xx+a*.247,(lo+hi)/2,6.56,.052,hi-lo+.09,.14,COURT?'#b78e6c':'#cca98a')
    }
    archBlocks(p,x,9.67,6.61,.89,1.13,0,Math.PI,COURT?27:17);archBlocks(p,x,10.14,6.68,.32,.46,0,Math.PI*2,28);
    for(const side of [-1,1]){
      p.rod([x,12.08,6.77],[x+side*1.89,10.91,6.77],.071,.071,'#d8c5a8',5);
      for(let k=0;k<10;k++)p.box(x+side*(.15+k*.212),12.64-(.15+k*.212)*.66,6.89,.09,.14,.46,'#846d54');
      for(let i=0;i<9;i++){const zz=.44+i*.72;p.rod([x,12.82,zz],[x+side*2.78,10.96,zz],.067,.083,'#607c6a',8)}
    }
    for(let j=0;j<19;j++){const z=.02+j*.371;for(const s2 of [-1,1])p.rod([x+s2*2.68,10.96,z],[x+s2*2.83,10.86,z],.061,.071,'#587361',9)}
  }
  for(const x of [-1.48,1.48]){
    p.box(x,4.6,6.689,.18,5.25,.025,'#fff','glaze');
    for(const [y,w,d] of [[1.43,.76,.76],[1.55,.69,.7],[7.16,.69,.73],[7.29,.8,.79],[7.4,.96,.85]])p.box(x,y,6.36,w,.11,d,'#cab898');
  }
  if(!COURT)archBlocks(p,0,3.69,3.58,.78,1.02);
  for(const s of [-1,1]){
    const x=s*.345;
    if(!COURT){p.box(x,2.55,3.61,.651,1.98,.13,'#363a39','lacquer');
    p.box(x,3.18,3.70,.49,.54,.038,'#798d92','glass');
    for(const t of [-1,1]){
      p.box(x+t*.219,3.17,3.736,.031,.56,.045,'#343838');
      p.box(x+t*.129,2.24,3.702,.192,.94,.032,'#464a47','lacquer');
      for(const h of [-1,1])p.rod([x+t*.235,3.18+h*.135,3.752],[x+t*.141,3.18+h*.255,3.752],.018,.018,'#383b39',6)
    }
    p.box(x,3.18,3.748,.032,.56,.04,'#373938');p.box(s*.077,2.43,3.754,.029,.20,.048,'#ad9566');}
    const lx=s*.90;
    p.rod([lx,3.39,3.76],[lx,3.39,3.92],.038,.031,'#393a32',8);
    p.rod([lx,3.40,3.91],[lx,3.61,3.91],.060,.089,'#cec8b3',6);
    p.rod([lx,3.61,3.91],[lx,3.67,3.91],.108,.031,'#363a34',6);
    for(let j=0;j<6;j++){const a=j*Math.PI/3;p.rod([lx+Math.cos(a)*.06,3.40,3.91+Math.sin(a)*.06],[lx+Math.cos(a)*.09,3.61,3.91+Math.sin(a)*.09],.009,.009,'#414138',5)}
  }
  if(!COURT)for(const x of [-2.24,2.24]){
    p.box(x,2.04,6.38,.89,1.13,.26,'#ccb99a');
    p.box(x,2.03,6.54,.72,.90,.075,'#ede7d3','glaze');
  }
  if(!COURT)for(let i=0;i<8;i++){let y=(8-i)*.19;p.box(0,y+.003,6.85+i*.34,3.15,.024,.064,'#b8ac94')}
  if(!COURT)for(const xx of [-2.1,0,2.1])for(let i=0;i<8;i++){const a=i*Math.PI/4,l=1.02;let x=xx+Math.cos(a)*.53,z=-.5+Math.sin(a)*.53;
    p.rod([x,10.55,z],[x,11.23,z],.035,.035,'#68836b',5);
    if(xx===0&&i===0){p.rod([0,10.38,-.5],[0,11.19,-.5],.53,.53,'#526b5a',8);p.rod([0,11.19,-.5],[0,11.92,-.5],.78,.09,'#577b63',8)}
    for(let j=0;j<5;j++)p.rod([x,10.55+j*.124,z],[xx+Math.cos(a+Math.PI/4)*.53,10.55+j*.124,-.5+Math.sin(a+Math.PI/4)*.53],.027,.027,'#6f836a',4)
  }
}
function pavilionCarving(p){
  for(let i=0;i<8;i++){
    const a=(i+.5)*Math.PI/4,b=a+Math.PI/4;
    const A=(t,r,y)=>[r*Math.cos(t),y,r*Math.sin(t)];

    // 从柱身向相邻梁跨伸出一块完整的卷草形雀替，榫头埋进柱子和枋。
    for(const side of [-1,1]){
      const from=v3(...A(a,2.28,0)),to=v3(...A(a+side*Math.PI/4,2.28,0)),dir=to.sub(from).normalize();
      const sh=new T.Shape();sh.moveTo(-.10,3.42);sh.lineTo(.08,3.42);sh.quadraticCurveTo(.13,3.65,.28,3.67);
      sh.quadraticCurveTo(.40,3.67,.45,3.79);sh.quadraticCurveTo(.52,3.85,.69,3.85);sh.lineTo(.69,4.00);sh.lineTo(-.10,4.00);sh.closePath();
      const block=new T.ExtrudeGeometry(sh,{depth:.15,bevelEnabled:true,bevelSize:.018,bevelThickness:.016,bevelSegments:2,curveSegments:6});block.translate(0,0,-.075);
      p.add(block,'#cb9352',from.toArray(),[1,1,1],[0,-Math.atan2(dir.z,dir.x),0],'wood');block.dispose();
    }
  }
  const bell=new T.LatheGeometry([[.56,2.065],[.64,2.02],[.73,2.06],[.74,2.15],[.66,2.22],[.56,2.42],[.51,2.69],[.47,2.93],[.37,3.12],[.20,3.19],[0,3.19]].map(([x,y])=>new T.Vector2(x,y)),72);
  p.add(bell,'#fff8e5',[0,0,0],[1,1,1],[0,0,0],'bell');
  const stud=new T.SphereGeometry(1,16,10);
  for(let i=0;i<24;i++){let a=i*Math.PI/12,x=Math.cos(a),z=Math.sin(a);
    for(const y of [2.80]){let r=y<2.5?.552:y<2.7?.516:.48;p.add(stud,'#807d64',[x*r,y,z*r],[.026,.029,.027],[0,a,0],'bronze')}}
  for(const [y,r] of [[2.12,.745],[2.23,.655],[2.68,.514],[2.76,.501],[2.97,.452]]){
    const torus=new T.TorusGeometry(r,.018,6,48);p.add(torus,'#817a5c',[0,y,0],[1,1,1],[Math.PI/2,0,0],'bronze');torus.dispose()
  }
}
// 用连续截面塑造衣料、四肢和脸部，再沿表面添加衣褶、衣襟和五官。


function sculpture(p,data=STATUE_MESH){
  // 用自制的雕塑参考图经 TripoSR 重建，位置量化到万分之一场景单位；颜色为表面烘焙值。
  const bytes=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0)),pos=new Int16Array(bytes(data.v).buffer),idx=data.wide?new Uint32Array(bytes(data.f).buffer):new Uint16Array(bytes(data.f).buffer),rgb=bytes(data.c);
  const geom=new T.BufferGeometry(),colors=new Float32Array(rgb.length);
  for(let i=0;i<rgb.length;i+=3){
    const c=new T.Color().setRGB(rgb[i]/255,rgb[i+1]/255,rgb[i+2]/255,T.SRGBColorSpace);
    // 降低大块色斑的权重，把形体明暗交给实时法线与环境光。
    colors[i]=.025+c.r*.69;colors[i+1]=.028+c.g*.79;colors[i+2]=.022+c.b*.74;
  }
  geom.setAttribute('position',new T.Float32BufferAttribute(Float32Array.from(pos,n=>n/10000),3));geom.setAttribute('color',new T.BufferAttribute(colors,3));geom.setIndex(new T.BufferAttribute(idx,1));geom.setAttribute('normal',new T.Float32BufferAttribute(Float32Array.from(new Int8Array(bytes(data.n).buffer),q=>q/120),3));geom.translate(0,2.45,0);
  const g=geom.toNonIndexed();g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));p.bins.set('castBronze',[g]);geom.dispose();
}

// 外墙在每个窗洞位置断开。侧向观察时，可看到砖窗膀、窗台以及向内退进的窗框。
function hallWing(p,s){
  const outer=s*10.50,inner=s*3.02,lo=1.35,hi=6.95,front=5.25,back=-5.25,x=(outer+inner)*.5;
  for(const z of [back,front])p.box(x,4.15,z,7.48,5.6,.115,'#fff','brick');
  p.box(inner,4.15,0,.12,5.6,10.5,'#fff','brick');p.box(x,hi-.045,0,7.48,.09,10.50,'#c3ac88');
  const row=[-3.8,-1.2,1.5,3.9],w=1.22,h=1.61,depth=.34,axis=outer-s*depth/2;
  const block=(y0,y1,z0,z1)=>p.box(axis,(y0+y1)/2,(z0+z1)/2,depth,y1-y0,z1-z0,'#fff','brick');
  let y0=lo;
  for(const y of [2.85,5.55]){
    block(y0,y-h/2,back,front);let z0=back;
    for(const z of row){block(y-h/2,y+h/2,z0,z-w/2);z0=z+w/2;
      p.box(outer-s*.264,y,z,.038,h-.03,w-.035,'#526766','glass');
      for(const side of [-1,1])p.box(outer-s*.241,y,z+side*(w/2-.034),.066,h,.058,'#56473b','wood');
      for(const t of [-.47,-.22,.0,.23,.47])p.box(outer-s*.212,y+h*t,z,.052,.033,w-.077,'#63513e','wood');
      for(const t of [-.26,.0,.26])p.box(outer-s*.208,y,z+w*t,.052,h-.04,.034,'#594b3b','wood');
      p.box(outer-s*.085,y-h/2-.041,z,.34,.088,w+.135,'#bcad95','granite');
      for(let q=0;q<9;q++)p.box(outer+s*.005,y+h/2+.085,z+(q-4)*w/8.7,.07,.165,w/9.65,choose(['#a97654','#a97e5a','#b28360']));
    }block(y-h/2,y+h/2,z0,front);y0=y+h/2;
  }block(y0,hi,back,front);
}

function createHall(){
  const p=new Part('怀士堂'),width=21;
  p.box(0,.72,0,width+1,1.44,10.9,'#e2dbca','stone');for(const side of [-1,1])hallWing(p,side);
  if(COURT){
    p.box(0,2.94,-.98,6.09,3.20,8.54,'#fff','brick');
    p.box(0,5.74,-2.43,6.09,2.49,5.64,'#918375','brick');
    for(const s of [-1,1])p.box(s*2.94,5.75,1.83,.22,2.48,2.91,'#ac9988','brick');
    p.box(0,4.55,1.81,6.09,.15,3.08,'#736658','stone');
    p.box(0,4.69,3.26,6.09,.24,.13,'#ba967e','brick');
  }else p.box(0,4.15,-.98,6.09,5.6,8.54,'#fff','brick');
  p.box(0,1.46,4.99,6.2,.16,3.45,'#e3d8c3','paving');
  p.box(0,7.06,4.8,6.28,.21,3.63,'#9e876c','wood');
  hip(p,0,7.1,-.4,22.8,11.6,3.5,13);
  for(const s of [-1,1]){
    const x=s*5.35;
    p.box(x,.78,3.32,4.7,1.56,6.4,'#e2dbca','stone');p.box(x,6.25,3.32,4.55,9.4,6.3,'#ffffff','brick');
    gable(p,x,10.95,3.34,5.55,7.5,1.85);
    for(const side of [-1,1]){
      let xx=x+side*1.75;for(const [lo,hi] of [[1.7,3.0],[3.25,7.0],[7.28,9.45],[9.68,10.45]])p.box(xx,(lo+hi)/2,6.505,.32,hi-lo,.09,green);
    }
    for(const yy of [2.95,6.4,8.95])if(!COURT||yy!==(s<0?8.95:6.4))windowBay(p,x,yy,6.51,1.12,1.58,yy<4);
    for(const yy of [3.15,7.14,9.57])for(const edge of [-1,1])p.box(x+edge*1.76,yy,6.57,.62,.105,.15,'#bc9e82');
    if(!COURT)for(const yy of [4.64,7.65,11.11])p.box(x,yy,yy>10.5?6.73:6.54,.57,.57,.11,trim,'plain',[0,0,Math.PI/4]);
    p.rod([x,10.17,6.52],[x,10.17,6.63],.32,.32,'#c6ae89',18);
    windowBay(p,x,1,6.55,1,.71);
    for(const y of [2.9,5.75])windowBay(p,s*9.1,y,5.28,1.1,1.6,true);
  }
  hallCarving(p);entranceMasonry(p);if(!COURT)inscription(p);
  p.box(0,7.40,6.26,6.34,.265,.56,'#b6a78b','granite');
  p.box(0,7.55,6.31,6.46,.071,.59,'#c6b590','granite');
  // 北门廊向内退，让柱间能看到真正的阴影和后面的门窗。
  p.box(0,7.61,4.1,7.1,.34,4.9,'#afa28b');hip(p,0,7.85,4.0,7.75,5.45,1.77,5);
  for(const x of [-1.48,1.48]){
    p.box(x,4.56,6.34,.52,6.2,.59,'#fff','brick');p.box(x,4.7,6.66,.17,5.12,.05,green);
    p.box(x,1.52,6.33,.7,.53,.8,trim);p.box(x,7.46,6.32,.92,.33,.88,trim);
  }
  for(let i=-1;i<=1;i++){
    windowBay(p,i*1.85,5.64,COURT?.41:3.36,COURT?.97:1.21,COURT?1.49:1.77,true);
    if(!COURT)windowBay(p,i*1.85,2.75,3.36,1.30,2.55,i===0);
  }
  if(COURT)courtTreads(p);else steps(p,0,6.7,3.1,8);
  if(!COURT)for(const x of [-2,2]){p.rod([x,10.28,-.5],[x,11.21,-.5],.55,.55,'#4b6253',8);p.rod([x,11.21,-.5],[x,11.93,-.5],.82,.09,green,8);p.rod([x,11.89,-.5],[x,12.13,-.5],.095,.05,green,8)}
  for(const x of [-8.8,-6.3,-3.8,-1.3,1.3,3.8,6.3,8.8])for(const y of [2.85,5.5])windowBay(p,x,y,-5.3,1.12,1.52,true,-1);

  return p.finish();
}
// 花岗岩栏板留出透孔，端柱压顶。铜像和惺亭的台基共用这种构件。

// 亭台两侧各有一段连续修剪的绿篱，南、北两组石阶在正中留出通道。
function createPavilionHedge(){
  const part=new Part('惺亭台基绿篱'),positions=[],colors=[],normals=[],uvs=[];
  const shade=new T.Color(),saved=seed;
  function vertex(v,c,n){positions.push(...v);colors.push(c.r,c.g,c.b);normals.push(...n);uvs.push(0,0)}
  for(const sign of [-1,1]){
    const path=[];
    function line(x,z,dx,dz,len){for(let k=0,n=Math.ceil(len/.12);k<n;k++){let t=len*k/n;path.push([sign*(x+dx*t),z+dz*t,sign*dx,dz])}}
    function bend(z,a){for(let i=0;i<14;i++){let t=a+i*Math.PI/28;path.push([sign*(4.50+.57*Math.cos(t)),z+.57*Math.sin(t),-sign*Math.sin(t),Math.cos(t)])}}
    line(1.18,-4.40,1,0,3.32);bend(-3.83,-Math.PI/2);line(5.07,-3.83,0,1,7.66);
    bend(3.83,0);line(4.50,4.40,-1,0,3.32);path.push([sign*1.18,4.40,-sign,0]);
    const rings=[],profile=[[-.21,.12],[-.34,.23],[-.36,.52],[-.31,.69],[-.18,.76],[.03,.78],[.20,.75],[.31,.68],[.36,.53],[.34,.25],[.21,.12]];
    for(let i=0;i<path.length;i++){
      const [x,z,dx,dz]=path[i],nx=-dz,nz=dx,row=[];
      for(const [offset,y] of profile){
        const wave=(noise(x*3.7+offset,z*3.7+y)-.50)*.067+(noise(x*1.9+11,z*1.9)-.5)*.07;
        const n=v3(nx*offset*3,Math.max(.05,(y-.42)*3.6),nz*offset*3).normalize().toArray();
        const distToTip=Math.max(0,1.52-Math.abs(x));
        const taper=Math.sqrt(Math.max(.005,1-(distToTip/.34)**2));
        const v=[x+nx*(offset+wave)*taper,.43+(y+wave-.43)*taper,z+nz*(offset+wave)*taper];
        const c=new T.Color('#657d40').multiplyScalar(.64+.40*noise(x*4.8+y*12,z*4.8+offset*9)+y*.21);
        row.push([v,c,n]);
      }
      rings.push(row);
      if(i>0)for(let j=0;j<profile.length-1;j++){
        const a=rings[i-1][j],b=row[j],c=row[j+1],d=rings[i-1][j+1];
        for(const tri of [[a,b,c],[c,d,a]])for(const q of sign>0?tri.slice().reverse():tri)vertex(...q);
        // 让单叶略微越过修剪面，叶片沿枝条分簇且带明暗变化。
        for(let k=0;k<6;k++){
          const f=random(),h=random(),mid=a[0].map((v,l)=>mix(mix(v,b[0][l],f),mix(d[0][l],c[0][l],f),h));
          const normal=v3(...a[2]),w=range(.018,.036),leafDir=v3(dx*range(-1,1)+normal.x*.4,range(-.4,.65),dz*range(-1,1)+normal.z*.4).normalize(),side=normal.clone().cross(leafDir).normalize();
          const base=v3(...mid).addScaledVector(normal,.008),tip=base.clone().addScaledVector(leafDir,w*2.5);
          const center=base.clone().lerp(tip,.48).addScaledVector(normal,.008);
          const left=center.clone().addScaledVector(side,w*.52),right=center.clone().addScaledVector(side,-w*.52);
          const tint=shade.set(choose(['#738b47','#7c944f','#688044','#708747','#8a9c55'])).multiplyScalar(.86+.19*noise(mid[0]*5+4,mid[2]*5)+a[0][1]*.09);
          for(const point of [base,left,tip,tip,right,base])vertex(point.toArray(),tint,a[2]);
        }
      }
    }
    for(const k of [0,rings.length-1]){
      const row=rings[k],[x,z,dx,dz]=path[k],n=[dx*(k?1:-1),0,dz*(k?1:-1)];
      for(let i=0;i<row.length;i++){vertex([x,.46,z],row[i][1],n);vertex(row[i][0],row[i][1],n);vertex(row[(i+1)%row.length][0],row[i][1],n)}
    }
  }
  // 台阶端头有独立的小枝团，轮廓分几层退入圆角。
  for(const side of [-1,1])for(const end of [-1,1]){
    for(const [dx,y,dz,r] of [[1.38,.44,-.13,.23],[1.45,.53,.12,.24],[1.54,.66,-.04,.21],[1.38,.29,.08,.21],[1.62,.47,.23,.20],[1.31,.49,.02,.18]]){
      shrubLeaves(part,side*dx,y,end*(4.40+dz),r);
    }
  }
  const geo=new T.BufferGeometry();
  for(const [name,array,count] of [['position',positions,3],['normal',normals,3],['color',colors,3],['uv',uvs,2]])geo.setAttribute(name,new T.Float32BufferAttribute(array,count));
  mats.hedge=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide,emissive:0x28351c});
  mats.hedge.onBeforeCompile=translucentLeaf;
  part.bins.set('hedge',[geo]);seed=saved;
  const hedge=part.finish();for(const mesh of hedge.children)mesh.castShadow=false;return hedge;
}

function createPavilion(){
  const p=new Part('惺亭');
  p.box(0,.34,0,9.6,.68,8.1,'#ece4d3','stone');p.box(0,.71,0,9.8,.12,8.3,'#ded8c7','paving');
  for(const side of [-1,1]){platformRails(p,[side*4.65,-3.96],[side*4.65,3.96],.76,4);
    for(const z of [-3.96,3.96])platformRails(p,[side*4.65,z],[side*1.05,z],.76,2);
    steps(p,0,side*4.23,2.2,4,side)}
  const corners=[];for(let k=0;k<8;k++){const t=k*Math.PI/4+Math.PI/8,x=2.28*Math.cos(t),z=2.28*Math.sin(t);corners.push([x,z]);p.rod([x,.7,z],[x,4.16,z],.157,.146,'#923934',32,'lacquer');p.box(x,3.97,z,.35,.18,.35,'#97453a','wood')}
  const soffit=new T.CylinderGeometry(2.42,2.42,.13,8);p.add(soffit,'#634b35',[0,4.10,0],[1,1,1],[0,0,0],'wood');
  roofPavilion(p);
  const finial=new T.LatheGeometry([[.11,0],[.16,.05],[.092,.12],[.13,.2],[.14,.26],[.098,.33],[.03,.40]].map(([r,y])=>new T.Vector2(r,y)),24);
  p.add(finial,'#546787',[0,6.52,0]);p.box(0,3.78,0,4.5,.2,.19,'#493d32');p.rod([0,3.8,0],[0,3.52,0],.065,.06,'#443e30');
  for(const [y,angle] of [[3.50,0],[3.32,Math.PI/2],[3.18,0]]){const link=new T.TorusGeometry(.097,.026,8,22);p.add(link,'#867954',[0,y,0],[.8,1.22,1],[0,angle,0],'bronze');link.dispose()}
  pavilionCarving(p);
  const group=p.finish(),bounce=new T.PointLight(0xffead0,6.10,6,2);bounce.position.set(1.35,3.10,1.45);group.add(bounce);return group;
}
function createStatue(){
  const p=new Part('孙中山铜像');
  p.box(0,.43,0,4.8,.86,3.1,'#eae1ce','stone');p.box(0,.9,0,5,.13,3.2,trim);
  for(const side of [-1,1]){for(let i=0;i<5;i++){let h=(5-i)*.18;p.box(side*(2.55+i*.26),h/2,0,.3,h,2.7,'#d7ccba','granite')}
    platformRails(p,[-2.35,side*1.48],[2.35,side*1.48],.96,4);
    for(const end of [-1,1]){
      const xx=end*3.65,zz=side*1.47;p.box(xx,.37,zz,.24,.74,.24,'#d3c6af','granite');
      p.box(xx,.76,zz,.29,.067,.29,'#d4c6ad','granite');p.rod([end*2.35,1.59,zz],[xx,.63,zz],.10,.10,'#d3c7b2',6,'granite');
    }}
  for(const [y,w,h,c] of [[1.04,1.63,.17,trim],[1.18,1.45,.15,stone],[1.77,1.2,1.08,'#b6a58f'],[2.37,1.56,.16,trim]])p.box(0,y,0,w,h,w*.84,c,'granite');
  // 上沿与底脚的石匠线脚在斜光中留下窄窄一圈阴影。
  for(const [y,w,d,h,col] of [[2.267,1.29,1.093,.034,'#9b9281'],[2.289,1.38,1.16,.029,'#c7ba9f'],[2.445,1.51,1.264,.022,'#d8ccb7'],[1.285,1.28,1.083,.04,'#b5a994']])p.box(0,y,0,w,h,d,col,'granite');
  sculpture(p);
  const monument=p.finish(),full=monument.children.find(mesh=>mesh.material===mats.castBronze);
  const distant=new Part('远景铜像');sculpture(distant,STATUE_DISTANT);
  const light=distant.finish().children[0],lod=new T.LOD();lod.name='铜像细节层次';
  lod.position.y=3.56;full.position.y=light.position.y=-3.56;
  lod.addLevel(full,0);lod.addLevel(light,14,.12);monument.add(lod);return monument;
}
// 沙盘底座和草坪分开制作，步道由草地板块之间露出的石铺面构成。
function slab(p,x,z,w,d,base,h,r,color,mat='plain'){
  if(mat==='grass'){grassBed(p,x,z,w,d,base,r,color);return}const s=new T.Shape(),a=w/2,b=d/2;
  s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);
  const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:4});g.rotateX(-Math.PI/2);p.add(g,color,[x,base,z],[1,1,1],[0,0,0],mat);g.dispose();
}
function createGround(){
  const p=new Part('校园底座与步道');
  slab(p,0,0,64,93,-.1,.1,1,'#faf8ef','paving');
  for(const s of [-1,1]){
    for(const [z,d] of [[-32.6,23.8],[-2.2,31.8],[27.8,24.3]])slab(p,s*22.75,z,15.7,d,.01,.08,1.4,'#d9e2bb','grass');
    p.box(s*13.2,.045,0,.12,.08,88,'#eee1be');
  }
  slab(p,0,-31.8,25.8,23.4,.01,.07,2,'#e0eac7','grass');
  slab(p,0,27,23.8,9.4,.01,.08,2,'#e2e9b6','grass');
  for(const s of [-1,1])slab(p,s*9.7,36.5,4.3,15,.01,.08,1,'#dce3ba','grass');
  for(let k=-8;k<9;k++)for(const sign of [-1,1])p.box(sign*13.9,.018,k*5,1.2,.015,.035,'#baac93');
  return p.finish();
}
// 轴线北端保持原位，南端往回收，露出怀士堂台阶前的横向铺地。
  const lawnShape=COURT?{width:24.2,length:25.4,offset:3.9,radius:7.8}:{width:24.2,length:30.6,offset:1.6,radius:4.6};
function createLawn(){
  const p=new Part('中区大草坪');grassBed(p,0,lawnShape.offset,lawnShape.width,lawnShape.length,0,lawnShape.radius,'#f4f1d2');return p.finish();
}
function createLodge(name,w,d,levels){
  const p=new Part(name),h=levels*2.45+.5;
  p.box(0,.37,0,w+.55,.74,d+.4,stone);p.box(0,.7+h/2,0,w,h,d,'#f8e4cd','brick');
  hip(p,0,.78+h,0,w+1.55,d+1.55,2.25,w*.57,'tile','#ebedda');
  for(const side of [-1,1])for(let i=0;i<5;i++)for(let floor=0;floor<levels;floor++)windowBay(p,(i-2)*w/5.3,2.1+floor*2.45,side*(d/2+.06),1.12,1.45,floor===0,side);
  for(const s of [-1,1])for(let k=0;k<3;k++)for(let floor=0;floor<levels;floor++){
    const x=s*(w/2+.055),y=2.05+2.45*floor,z=(k-1)*d*.3;
    p.box(x,y,z,.11,1.53,1.02,'#59483b');p.box(x+s*.065,y,z,.06,1.38,.89,'#65726c','glass');
    for(const t of [-.45,0,.45])p.box(x+s*.115,y,z+t,.09,1.4,.034,'#5b4939');
    for(const t of [-.64,-.19,.29,.65])p.box(x+s*.118,y+t,z,.09,.035,.9,'#5b4939');
    p.box(x+s*.086,y-.78,z,.22,.106,1.17,'#bdab91');
  }
  for(const x of [-w*.46,0,w*.46])p.box(x,1.6,d*.5+.8,.23,2.9,.25,trim);
  p.box(0,3.12,d*.5+.52,w+.35,.22,1.6,'#6a826d');p.box(0,.42,d*.5+.6,w,.18,1.45,stone);
  return p.finish();
}
const crowns=['#5d8b61','#779e63','#517e60','#648d60','#819660','#53855f','#81a05f'];
const leafGeo=new T.IcosahedronGeometry(1,1);
// 每棵树使用可重现的枝杈、数个不规则冠团。枝叶在各自的树组件内合批。
// 每一截枝梢长出多条小枝。小叶有叶尖、两侧叶缘和凸起的中脉，能从任意角度观察。



// 将离线重建的网格和索引色场展开。栅格只存自制原型的颜色采样，不需要读取图片。
function unpackBytes(s){
  if(Uint8Array.fromBase64)return Uint8Array.fromBase64(s);
  const binary=atob(s),out=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out;
}
function fieldTexture(source){
  const ids=unpackBytes(source.i),palette=unpackBytes(source.p),c=document.createElement('canvas');c.width=source.w;c.height=source.h;
  const ctx=c.getContext('2d'),image=ctx.createImageData(c.width,c.height);
  for(let i=0;i<ids.length;i++){let k=ids[i]*3;image.data[i*4]=palette[k];image.data[i*4+1]=palette[k+1];image.data[i*4+2]=palette[k+2];image.data[i*4+3]=ids[i]?255:0}
  ctx.putImageData(image,0,0);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}
const TREE_DEPTH=[{"w": 1.0945266485214233, "d": 0.8986697196960449, "z": "AAAAAAAAAAAAAAAAAwQAAAIQWY1tHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEU10eEkN4mKGgbxcLAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmj5qKgZ2kr7Owo4RpRhUAAAAAAAAAAAAAAAAAAAAAAAAAFghdnKmiprG5vMS6tKaVlFcQAAAAAAAAAAAAAAAAAAAAAAEPdXSLoa6xubzFwsfFvK2cnpJ8NhQAAAAAAAAAAAAAAAAAADVml62op7bAyM3MwsXEv6iltrSzonYGAAAAAAAAAAAAAAAIHGiSpbG3uczX2t7cxb+/ubC0ube4s6dBAAAAAAAAAAAAAB5/l5uns7a6y9zf4eLl1se/uLW2t7a3s6g6AAAAAAAAAAAAB3ewt7e3ucDI1t7h4OHm39TOycC9urW0roYiCgAAAAAAAAAAJ6S0vL/AwdDb3dvc2tvj39ze3tvXx7Krl3mQYRgGAAAAAAAAHpa0vL+/w9fh4NvY19bc4eXl6enk0LWzp6yzrJNMAQAAAAAPTJuyuLq7xNnf3NjV1dTc4eTl7Ovn2snGvLm4uLaYJQUAABFxoK2zuLi80N3e2tfV2OPo4Nvf6Ojm5t7Wyby7vLy1lQ4AADWZrri8vL7J3Obp5+Tf5fH05tnY3N7l6eXc0L7Awr24oQ8AAE+etL/Ix8XT4uju8PLy8/T27uPZ2t/k6eXg0L2+wb2tZAQAAAxjrL7JyMPO3eHq8/f29vX48OXc2Nrf4+Hdz7y7uriZHwAAAABAoLi/wL7L3uPt8vT09Pf57t/b19XW29rWxrq3t7WfTAIAABqFn7O3uL3c6u/29PLw7/f57djY19XPzMzAure1treuigsAG3yptLa1vM3l7/P5+/rz7vP35dTV09LPys7Cube1tLSscwMAOZy2wMXCztXd5u/3/Pv07Ojq1szO0tXRy9PTzMW8s62eiEEGFo63yM7R2dzY3+r2+PHp3NPZzsPP3ebf1N3g2tPNv7WrnIAQBXe3xM3V3N7c5+729d7Hxs/ZzMrf6vLt4eLn4NrW0Ma+rHQELJSzvcTQ2Nbf7O3t69Wtv9Pe1M3a6PDw6uPj3NjX1MzCuKNWc6a2uLrFys3j7efe3cSpu9Tm18rY6+7y8uHZ2drUz87HubOWjaayrrG1us7h6N3V1Lm0utLo3M/g7evx897X4uTXxcnCtqx4UZOcmp+dtM3XzcDN0662ucvn49XY5NPb59Tb5ubdyLa3s5MlCXaVmbGjqsG/nKHDxJ+0u8Tj6d/Uup6wyLrY3N/czrS0tp8/ADSWprq2truwlZSmpJiuurvW4tm9nJapoZzExs3XyKGirpAiAC6Xsbq3t7azm5OTkpWruLbD08uqoZWXlZSjtrvAqpiXj0wMAEuYqbKysqmypZORkJKptrS2ubKbnJSUk5SVprWnl5aXeAYAAEqWnJqboJSbm5CRjo6esLKyqKKXlpSSkpOTlZ+ZlJWWdwYAAB6FgYONlpKLanyQcmyRo62rpaSenJSTk5OUkJKTlJOQRgIAAAMdFV+Cjo+BT0+GTk+GnaWmoaGino2RjY+QeF6IknFFCwAAAAAACWp/f3x6TiZhPEtvm6Kkn56fj11vYnx0LgcvQBkBAAAAAAAAC2xzd3JnFggvGURVl5+gnpuVbVNPT2o/BQAAAQAAAAAAAAAAASY/cGk9AAACAhwciJ6dnZhnOUI0RGISAAAAAAAAAAAAAAAAAAACOysFAAAAAAADeZ6ennoRDQUEDywCAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAADeZ+gnmoAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADeqGioGsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADe6OmoWoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADfaWopGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKjKmrqX0DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWoa6vrp4WAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAurbS1tbBsBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABePu7m6vrirVwYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFYCytbazubOsq1ABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAN5KTlJuam5OVmGoGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABiIkMk9xYk8zSggAAAAAAAAAAAAAAAAA"},{"w": 0.6214882731437683, "d": 0.5387620329856873, "z": "AAAAAAAAAAAAARVNHCuSjlZKCApkRAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAEPZGvfJq+u7u0f4O4q2EQAAAAAAAAAAAAAAAAAAAAAAAAAARYo7zFyc3Pz9DQzcvIxLY1AAAAAAAAAAAAAAAAAAAAAAAAABeiv8nPz9DS0dPUzsfGwa5qJB8SHyYEAAAAAAAAAAAAAAEEBA16wM7Vyb3DzNDMwri/uqqYiZmGjpFMBAAAAAAAAAAABTdiZWyYtM3XsEdOtcTJv77Ow7m5v8e8tJ6HIAAAAAAAAAAAR42Umqqjo8bNlXN9osba0NPh3NLc397azaeXhlMRAAAAAAALeZqitcnDxNfZz6ubu9nh2tvj4dng4Nza1cKso5pnAwAAAABJl6i4yNHR0t3c1Le20ubt3dHY2NTT0szFycCvo52ABgAAAAV4n7LAxMbDudLQwKq/yufx2qahrbWioZ2ampqXfYYwAAAAAABBh5icnpyamKqimJaduufv4bahoa6kq7+8pZ2QNjMeGwoAAAABImGCkpGRkZKSkZKVr9/t5dbe3OPj5uPg1rmZiYuNkWYJAAAFNXmRn56Uk5CQkZGTr9jp29rx8vH19Ozm3s+llJeZl1cEAABGipWpx8Ohm5CQkZGSsNLg1dLg6e719u3o3NClkpGQagsABy5kj5aer56Sjo2PkJGRnsvax7Ggq9Hr8+7t3symlZGMbT4MX42alJKRkI6PmqOpqJWSsNfhp4+OjZ3b5+ro5eHax7CjlpV9hpGfko+MioyOt+Lp4cqqyOvvr46Pjo+yxM/W4uvo4tO6oZVvToViVouJiI2PwPP38eXa2/H3r5OUkZCPh4OKn9Ll4dq+lFEIAh8hS4uMkKK/3vj77t/d5/X61azCpI1sHwweiLTO2NbNnTsBAAALVJChw9Xc4e7v28DI2eLjwaasoJ2ULgAYiJSZq7zCnIQzAAk/c5K/2uHi3t3LpZSXprzFnpORnc3YfwM1ioB9X2CLmJNzCVeHj5O21+HRpaKUj5CRk6m0mZGRruTWlV1oOQ4MAQAjfmgUNHqBipCYqLacdUdGRl+Lj5ukko6PkayekJB6JwgBAAABFQoACiEsd4+TlJCLagMAAAZUjpCRjYWMVzN9nbyijG05BQAAAAAAAAIogZCTkodOPgEADxwzjJGQe1mKQW6p09TRxJ6NSAAAAAAAADB6iIyLYkYEAQADU7nHtJSeiYKQpc/g5OLg3cSSWwAAAAAAACJda4p8GAIAABJ1yu3w1rq4kZCRjU6DkMXg4c6XRAAAAAAAAAAEE1VPAgAAEnPh6vLvtb6ylZKQbigpU5S5za+WcxgAAAAAAAAAAAQHAAAAIo7j7OzgPXiSlpaohmOEh4qRlpeVj1oBAAAAAAAAAAAAAAAABD3E2ubUL3eTlqHWhBg1NyE1c2l1YRgAAAAAAAAAAAAAAAAAACRPW6N5OY2Tk5m6j0QGAAAACAUJBAAAAAAAAAAAAAAAAAAAAAwxRDg8WZCReEqHjmsbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKO0JYh4+KUS5hg4NcEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAASR0dmjYxsT05QT09TGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAADJyhljn8lSUgXEggEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQZpj3QGJiUBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB6Jj2sDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCKjUwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCKjC0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCLjUMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCMkFkBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCNkGcDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACGNkDsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACGOkSwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACGQkzsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADqUllgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAV2XmYAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVyXmZQzAAAAAAAAAAAAAAAAAAAAAAAA"},{"w": 1.4929970502853394, "d": 1.1074697971343994, "z": "AAAAAAAAAAAAAAAAAAAAAAQEQAk+bl4TAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGFRCg011kIgnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIEJoSJjIiRnJAnAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAElphOW2ipaqss6g+AjBPXlMUAwAAAAAAAAAAAAAAAAAAAAAAHYiZhoGisL2zsqRSFnyNj5qAPgAAAAAAAAAAAAAAAAAAAAAABVCZmpessL+vpGRHdZWYnqidUQAAAAAAAAAAAAAAAAAAAAAGAwVpk7O9q6pmeYqmrLOprLKhTgAAAAAAAAAAAAAAAAAAAABPQBJnlbnCqpJFaLe7v7u0sbObXQgAAAAAAAAAAAAAAAAACQ1mgHSJkrO8p5+Lnp+5ycW2qaePgxUAAAAAAAAAAAAAABIqcH+ElaafkJq0pqN1gY2xz83ApY+CaAIAAAAAAAAAAAAABGSKoKaQrMOzkY6woYU7h4uVwc7OtI+ScRYcAwAAAAAAAAAAB3ulrLOyytPFnJ+/tJVolouOrsjPt5GjjXZ/VggAAAAAAAAAAFejmbjJ3+DfzdDh2tO5u5esqrzGpZWwr6SqlE4CAAAAAAAAACiMlsPS5+jq3+Lv7ujd1sTCrZtzWIazuLu3pYYTAAAAAAAAEEF6stbd5ubs5e359fPl3+HYsnQSAkypur69rXoGAAAAAAAGYYeQw9rd3dzl5PD8+fnr6fLw05dGTXeYtb7Bp3AEAAAAAAAYhIqKs9jVz7nP1e369fXo6/b46Me3v7KYq7bApYQRAAAAABxQiYVKjry4tJyfr9vx5NfE3ez17djW2c+XkJuzrZg6AAAABWyKiYRTiIWJi4iJi6rhzJKRts7k4dbY3dqfdESYm5OCAAAAH4aJh4eFiEZBfIeJiaHUr4qJi5evrrzT19nCixJNNUNIAAAAI3RQdImJiFUjV4eIiaDJooqJiYqKjJi3qbrEtE4EAAAAAAAABQ8Qe4qKiZGceYeHiZ/CoYqIiomKioyQfSGcxKFfMxEAAAAAAgM6k5CPlq+0lImIiaLEo4qJiomJiouMhVOhw7upmngXAAEoUECAqJeovL67rIyJjKzJqomJiomBiYqLi42Ys7W0sKNlABSCmZeYrpyyyMenoYqIiKLPqYmJiHckMTpei46KRnCmqJeCAkWar7CusrC0xcidioiJh5bJqImHfSciAgAwj4+CEiWRln8wP4ytt7m4ura2traThoiJh5TBpImHXB98QBVuo5mKVlKRj34OeZmvuby6u7azraKJhoeJiJW3ooiHNSCJiY6qrKiutKuij38NUI2gtbasrqWak5CHh4eIiJGtnImHMiGKlaaurKqzwLywmHoFKouUq6CSko2LioqIiYiIiIyglImIM0GNlKarp6CzxsW4poURbY6Yk4yKioqJiYmJiomJiIqXj4mIX4KNj6OompWuxsvAsKNsioyNil9DT32Fh4iIiomIiIiTjoqIiIuNjpeflJGhr7i9sKmbe2hoexcAAhw/T4KIiImIiIORkIuIiYqMjY6WkopjOYCwrJ9lIAcYTAIAAAAAA1uHiIiIiW6OkYqHhYSMiW5ldj0DACObpYgLAAABBwAAAAAAACuFiIeHiXSPkImFYWyKUgsEDwIAAAI5c1kBAAAAAAAAAAAAAAlghIeGiIiVjodhYYZoDAAAAAAAAAAAHxMAAAAAAAAAAAAAAAAHPHOFhomTjYZYdE4MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATGEhomPi4aEYgkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA12homNioZ2FwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5g4iIh4ArAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQeYaGhUgCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACXIWGdRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO4WFQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFn59DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHh7CQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHhrBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHh2BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHh7CQAAAAAAAAAAAAAAAAAAAAAA"}];
const TABLET_STROKES=[[[[21, 32], [20, 33], [20, 35], [21, 34], [22, 34], [23, 35], [23, 38], [24, 39], [23, 40], [26, 42], [24, 40], [24, 39], [26, 36], [27, 37], [26, 36], [24, 36], [23, 35], [24, 34], [24, 32]], [[2, 30], [2, 32], [3, 33], [3, 34], [2, 35], [2, 37], [3, 38], [3, 41], [5, 38], [6, 39], [9, 39], [10, 40], [10, 39], [7, 39], [5, 37], [5, 35], [2, 31]], [[23, 27], [23, 29], [26, 29], [26, 28], [25, 27]], [[14, 26], [14, 27], [15, 27], [16, 28], [18, 28], [19, 27], [18, 27], [17, 26]], [[1, 26], [1, 27], [1, 26], [2, 25], [3, 25], [5, 27], [4, 28], [3, 28], [5, 30], [5, 31], [6, 31], [5, 30], [7, 28], [9, 30], [8, 33], [9, 33], [11, 35], [12, 35], [11, 34], [12, 33], [13, 33], [15, 35], [15, 36], [18, 38], [17, 39], [15, 39], [17, 41], [19, 41], [17, 39], [18, 38], [18, 37], [17, 36], [16, 36], [13, 32], [12, 32], [10, 34], [8, 32], [10, 30], [11, 30], [11, 28], [10, 28], [9, 27], [8, 27], [7, 28], [6, 27], [6, 25], [5, 24], [6, 23], [5, 23], [5, 24], [4, 25], [2, 25]], [[19, 21], [18, 22], [18, 24], [19, 25], [20, 25], [21, 24], [21, 23]], [[24, 17], [24, 19], [25, 18], [26, 18], [25, 18]], [[19, 17], [19, 18], [23, 21], [23, 23], [24, 24], [25, 24], [24, 23], [25, 22], [24, 21], [23, 21], [20, 18], [20, 17]], [[4, 13], [5, 14], [5, 18], [5, 17], [6, 16], [7, 16], [9, 18], [9, 20], [9, 15], [8, 15], [7, 16], [6, 15], [6, 14], [5, 13]], [[24, 12], [23, 13], [24, 14], [25, 14], [25, 12]], [[19, 12], [18, 13], [19, 14], [20, 14], [20, 12]], [[13, 9], [13, 10], [14, 11], [12, 13], [11, 13], [14, 17], [16, 17], [17, 16], [15, 16], [14, 15], [14, 13], [16, 11], [14, 9]], [[24, 8], [24, 9], [25, 9], [25, 8]], [[10, 6], [6, 6], [6, 7], [5, 8], [4, 7], [3, 8], [5, 10], [6, 10], [6, 9], [5, 8], [7, 6]], [[16, 3], [17, 3], [18, 4], [17, 5], [17, 6], [18, 7], [18, 8], [19, 9], [20, 9], [20, 7], [19, 7], [18, 6], [20, 4], [20, 3]], [[5, 2], [6, 3], [6, 4], [7, 4], [8, 3], [9, 4], [11, 4], [12, 5], [10, 3], [7, 3], [6, 2]], [[22, 0], [24, 2], [24, 5], [25, 5], [26, 2], [25, 2], [23, 0]]], [[[4, 38], [5, 38], [6, 37], [4, 37]], [[16, 30], [15, 30], [15, 31], [14, 32], [13, 31], [12, 31], [13, 32], [12, 33], [12, 38], [13, 39], [15, 39], [15, 36], [16, 35], [17, 36], [17, 38], [18, 37], [17, 36], [17, 31]], [[2, 30], [3, 31], [4, 30]], [[4, 27], [4, 28], [5, 28], [5, 27]], [[20, 21], [19, 22], [19, 23], [20, 23]], [[9, 21], [8, 21], [6, 23], [7, 24], [7, 26], [9, 26], [8, 25], [8, 22]], [[14, 18], [14, 20], [12, 22], [13, 22], [14, 23], [14, 24], [13, 25], [16, 26], [16, 25], [17, 24], [17, 22], [16, 22], [14, 20]], [[3, 18], [2, 19], [2, 21], [0, 23], [0, 24], [0, 23], [2, 21]], [[28, 7], [28, 8], [25, 11], [25, 12], [24, 13], [23, 13], [23, 14], [28, 10]], [[13, 5], [12, 6], [11, 6], [11, 8], [13, 10], [12, 11], [11, 11], [11, 12], [13, 14], [15, 14], [17, 12], [17, 10], [16, 10], [15, 9], [17, 6], [16, 6], [15, 5]], [[5, 5], [5, 6], [6, 6], [6, 5]], [[8, 3], [9, 4], [10, 4], [10, 3], [11, 2], [8, 2]], [[5, 2], [4, 2], [3, 3], [1, 3], [2, 4], [2, 5], [4, 3], [5, 3]]]];
// 中远景树木沿深度场铺开，保留冠层前后遮挡与原型的镂空轮廓，近观时切回完整三维网格。
function reliefTree(id,h,w,jitter,bend){
  const d=TREE_DEPTH[id],bytes=unpackBytes(d.z),vs=[],uv=[],col=[],ids=[],nx=35,ny=47;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/ny,depth=bytes[((ny-j)*36+i)]/255-.5;
    const warp=.025*Math.sin(v*6.1+jitter)*Math.sin(v*Math.PI);
    vs.push(((u-.5)*d.w*(1+.04*Math.sin(v*4.2+jitter))+warp+bend*v*v)*w,v*h,(.26*Math.sqrt(Math.max(0,1-Math.pow((u-.5)*1.9,2)))*Math.sin(v*Math.PI)+depth*.06)*d.d*w);
    uv.push(u,v);let t=.92+.08*v;col.push(t,t,t);
    if(i&&j){const k=j*36+i;ids.push(k-37,k-1,k,k-37,k,k-36)}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(ids);
  const group=new T.Group();group.name='树冠深度模型';group.add(new T.Mesh(g,mats.relief[id]));return group;
}
function inscription(p){
  // 仅描摹参考图中可分辨的刻痕轮廓，不补写未能辨认的碑文。
  for(let i=0;i<2;i++){const x=i?1.85:-1.85,z=3.806;
    for(const poly of TABLET_STROKES[i]){const shape=new T.Shape();
      poly.forEach(([u,v],j)=>{let xx=(u/28-.5)*.69,yy=(.5-v/42)*.77;j?shape.lineTo(xx,yy):shape.moveTo(xx,yy)});
      shape.closePath();const g=new T.ShapeGeometry(shape);p.add(g,'#637167',[x,4.05,z],[1,1,1],[0,0,0]);g.dispose()}
  }
}

function translucentLeaf(shader){
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',T.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;',''));
}
// 为近景枝干生成顺纹的灰褐色树皮。粗沟、细裂和附生斑分别控制尺度。
function avenueBark(){
  const map=texture((ctx,size)=>{
    const im=ctx.createImageData(size,size);
    function patch(u,v,nx,ny){
      const x=u*nx,y=v*ny,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
      const at=(i,j)=>noiseTable[(((j%ny+ny)%ny)<<8)|((i%nx+nx)%nx)];
      return mix(mix(at(ix,iy),at(ix+1,iy),fx*fx*(3-2*fx)),mix(at(ix,iy+1),at(ix+1,iy+1),fx*fx*(3-2*fx)),fy*fy*(3-2*fy));
    }
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const u=x/size,v=y/size,meander=(patch(u,v,8,7)-.5)*.038+(patch(u,v,19,11)-.5)*.009;
      const w=u+meander,g=patch(w,v,84,18),groove=1-Math.min(1,Math.abs(g-.50)*15);
      const rib=patch(w,v,44,9)-.5,fibre=patch(w,v,210,59)-.5;
      const wear=patch(u,v,25,23),moss=Math.max(0,patch(u,v,13,10)*.72+wear*.28-.55)*55;
      const aged=COURT?patch(u+meander*2.8,v,11,4):.5;
      const q=(COURT?108:121)+rib*(COURT?48:31)+fibre*25-groove*(8+wear*(COURT?29:14))+(wear-.5)*21+(aged-.5)*46;
      im.data.set([q+8-moss*.32,q+3+moss*.27,q-8-moss*.42,255],4*(y*size+x));
    }
    ctx.putImageData(im,0,0);
  },512);
  return new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.011,roughness:.91,color:'#d3c9ad'});
}
// 原型的每一圈顶点含一对相合的接缝顶点。按索引判断枝条衔接，再按实际弧长展开。
function unwrapAvenueBark(geometry){
  const uv=geometry.attributes.uv,pos=geometry.attributes.position;
  const rings=[],ringOf=new Uint32Array(pos.count),point=v3(0,0,0);
  for(let start=0;start<pos.count;){
    let end=start+1;while(end+1<pos.count&&uv.getX(end)<.99999)end++;
    const center=v3(0,0,0);
    for(let k=start;k<end;k++)center.add(point.fromBufferAttribute(pos,k));
    center.divideScalar(end-start);
    ringOf.fill(rings.length,start,end+1);
    rings.push({start,end,center,connected:false});start=end+1;
  }
  const indices=geometry.index.array;
  for(let k=0;k<indices.length;k+=3){
    const a=ringOf[indices[k]],b=ringOf[indices[k+1]],c=ringOf[indices[k+2]];
    if(a!==b||a!==c)rings[Math.max(a,b,c)].connected=true;
  }
  let along=0,offset=0,repeat=1;
  for(let i=0;i<rings.length;i++){
    const {start,end,center,connected}=rings[i];
    if(connected)along+=center.distanceTo(rings[i-1].center)/2.16;
    else{
      offset=noise(i*.739+8.2,center.y*1.7);along=noise(i*.631+33,center.x);
      repeat=Math.max(1,Math.round(center.distanceTo(point.fromBufferAttribute(pos,start))*6.283/1.12));
    }
    for(let k=start;k<=end;k++)uv.setXY(k,offset+(k-start)/(end-start)*repeat,along);
  }
}

function banyanMaterials(){
  mats.relief=TREE_SKINS.map(s=>new T.MeshBasicMaterial({map:fieldTexture(s),alphaTest:.38,vertexColors:true,side:T.DoubleSide,color:'#dadcca'}));
  const sprig=fieldTexture(LIVE_FIELDS.branch);
  mats.liveBark=avenueBark();
  mats.liveLeaves=new T.MeshLambertMaterial({map:sprig,vertexColors:true,side:T.DoubleSide,alphaTest:.37,emissive:0x676d55,emissiveMap:sprig});
  mats.liveLeaves.onBeforeCompile=translucentLeaf;
}
const GROWTH=[{"seed":23399,"type":"deciduous","bark":{"type":"oak","tint":16774097,"flatShading":false,"textured":true,"textureScale":{"x":1,"y":10}},"branch":{"levels":3,"angle":{"1":54,"2":43,"3":32},"children":{"0":9,"1":5,"2":3},"force":{"direction":{"x":0,"y":1,"z":0},"strength":-0.025},"gnarliness":{"0":-0.04,"1":0.16,"2":-0.06,"3":0.09},"length":{"0":47.7,"1":29.39,"2":17.62,"3":7.16},"radius":{"0":3,"1":0.69,"2":0.69,"3":1.19},"sections":{"0":16,"1":9,"2":8,"3":3},"segments":{"0":12,"1":5,"2":3,"3":3},"start":{"1":0.35,"2":0.1,"3":0.0},"taper":{"0":0.73,"1":0.42,"2":0.69,"3":0.75},"twist":{"0":-0.23,"1":0.42,"2":0,"3":0}},"leaves":{"type":"oak","billboard":"double","angle":36,"count":10,"start":0.16,"size":4.5,"sizeVariance":0.7,"tint":14013901,"alphaTest":0.5},"trellis":{"enabled":false}},{"seed":29919,"type":"deciduous","bark":{"type":"oak","tint":13552830,"flatShading":false,"textured":true,"textureScale":{"x":0.5,"y":5}},"branch":{"levels":3,"angle":{"1":39,"2":39,"3":51},"children":{"0":10,"1":4,"2":3},"force":{"direction":{"x":0,"y":1,"z":0},"strength":-0.010869565217391311},"gnarliness":{"0":-0.05,"1":0.2,"2":0.16,"3":0.049999999999999996},"length":{"0":45,"1":29.42,"2":15.3,"3":4.6},"radius":{"0":3.03,"1":0.53,"2":0.79,"3":1.11},"sections":{"0":12,"1":8,"2":6,"3":4},"segments":{"0":8,"1":6,"2":4,"3":3},"start":{"1":0.32,"2":0.34,"3":0},"taper":{"0":0.7,"1":0.6199999999999999,"2":0.7599999999999999,"3":0},"twist":{"0":0.09,"1":-0.07,"2":0,"3":0}},"leaves":{"type":"ash","billboard":"double","angle":30,"count":10,"start":0.01,"size":4.62,"sizeVariance":0.72,"tint":16777215,"alphaTest":0.5},"trellis":{"enabled":false}},{"seed":36330,"type":"deciduous","bark":{"type":"oak","tint":13552830,"flatShading":false,"textured":true,"textureScale":{"x":0.5,"y":5.0}},"branch":{"levels":3,"angle":{"1":48,"2":75,"3":60},"children":{"0":7,"1":4,"2":3},"force":{"direction":{"x":0,"y":1,"z":0},"strength":-0.06},"gnarliness":{"0":0.03,"1":0.25,"2":0.2,"3":0.09},"length":{"0":43.47,"1":27.14,"2":9.51,"3":4.6},"radius":{"0":2,"1":0.63,"2":0.76,"3":0.7},"sections":{"0":12,"1":8,"2":6,"3":4},"segments":{"0":12,"1":6,"2":4,"3":3},"start":{"1":0.23,"2":0.33,"3":0},"taper":{"0":0.7,"1":0.7,"2":0.7,"3":0.7},"twist":{"0":0.09,"1":-0.07,"2":0,"3":0}},"leaves":{"type":"ash","billboard":"double","angle":55,"count":16,"start":0,"size":2.67,"sizeVariance":0.72,"tint":16777215,"alphaTest":0.5},"trellis":{"enabled":false}}];
// 近景枝干采用逐节放样的分枝骨架，末梢的真实大小依树高确定。树皮与叶丛均来自自制材料场。

// 主干与粗枝按截面距离场合成连续外皮，细枝继续沿用分枝原型。
let trunkIndex=0;
function joinAvenueTrunk(bark){
  const data=AVENUE_TRUNKS[trunkIndex++],covered=new Uint8Array(bark.attributes.position.count);
  for(const [first,last] of data.ranges)covered.fill(1,first,last+1);
  const indices=bark.index.array,remaining=[];
  for(let i=0;i<indices.length;i+=3)if(!covered[indices[i]])remaining.push(indices[i],indices[i+1],indices[i+2]);
  bark.setIndex(remaining);
  const coords=new Int16Array(unpackBytes(data.p).buffer),faces=new Uint16Array(unpackBytes(data.f).buffer);
  const geo=new T.BufferGeometry(),pos=Float32Array.from(coords,x=>x/1800);
  geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setIndex(new T.BufferAttribute(faces,1));geo.computeVertexNormals();
  const uv=new Float32Array(pos.length/3*2),norm=geo.attributes.normal,col=new Float32Array(pos.length);
  for(let i=0;i<pos.length/3;i++){
    const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2];
    uv[i*2]=Math.abs(norm.getX(i))>.7?z:x;uv[i*2+1]=y;
    const shadow=.89+.11*T.MathUtils.smoothstep(y,0,1.1),age=noise(x*3.5+14,z*3.5+y*.93);
    col.set([shadow*(.97+.09*age),shadow*(.96+.09*age),shadow*(.94+.09*age)],i*3);
  }
  geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setAttribute('color',new T.BufferAttribute(col,3));
  if(!mats.joinedBark){
    const mat=mats.liveBark.clone();mat.vertexColors=true;mat.bumpMap=null;
    mat.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 woodCoord,woodNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwoodCoord=position;woodNormal=normal;');
      shader.fragmentShader='varying vec3 woodCoord,woodNormal;\n'+shader.fragmentShader.replace('#include <map_fragment>',`
        vec3 w=pow(abs(normalize(woodNormal)),vec3(3.));w/=max(dot(w,vec3(1.)),.00001);
        vec3 q=woodCoord+vec3(.018*sin(woodCoord.y*3.+woodCoord.z*2.),0.,.014*sin(woodCoord.x*3.+woodCoord.y));
        vec3 fib=texture2D(map,q.zy*vec2(.94,.57)).rgb*w.x+texture2D(map,q.xz*vec2(1.12,.96)).rgb*w.y+texture2D(map,q.xy*vec2(.89,.54)).rgb*w.z;
        vec3 grit=texture2D(map,q.zy*vec2(2.65,5.8)+.13).rgb*w.x+texture2D(map,q.xz*vec2(3.7,4.1)+.56).rgb*w.y+texture2D(map,q.xy*vec2(2.6,5.6)+.35).rgb*w.z;
        float mineral=texture2D(map,vec2(q.x*.36+q.z*.91,q.y*2.11)).r;
        diffuseColor.rgb*=mix(fib,grit,.44)*vec3(1.01,1.025,1.065)*(1.+(mineral-.18)*.49);`);
    };mats.joinedBark=mat;
  }
  return new T.Mesh(geo,mats.joinedBark);
}

function createTree(type,low=false){
  const tall=type==='camphor',wide=type==='spreading',id=tall?1:wide?2:0;
  const height=tall?range(10.1,13.7):wide?range(7.5,9.6):range(9,11),width=height*(wide?.94:tall?1.04:.99),jitter=range(0,6.28),bend=range(-.046,.046);
  if(low)return reliefTree(id,height,width,jitter,bend);
  const tree=new CampusTools.Tree(),opt=tree.options,preset=GROWTH[id];
  opt.copy(preset);opt.seed=Math.floor(random()*100000);opt.bark.textured=false;opt.bark.flatShading=false;
  Object.assign(opt.branch.children,{0:tall?10:12,1:6,2:4});Object.assign(opt.branch.segments,{0:19,1:11,2:8,3:5});
  Object.assign(opt.branch.sections,{0:18,1:11,2:9,3:6});opt.branch.start[1]=tall?.32:wide?.25:.29;
  opt.branch.gnarliness[0]=tall?.038:.076;opt.branch.gnarliness[1]=.09;opt.branch.gnarliness[2]=.075;
  opt.branch.angle[1]=wide?66:tall?36:52;opt.leaves.size=tall?3.08:wide?3.13:3.38;opt.leaves.sizeVariance=.39;opt.leaves.count=wide?12:11;opt.leaves.start=.11;opt.branch.length[3]*=1.23;
  tree.generate();const bounds=new T.Box3().setFromObject(tree),dims=bounds.getSize(new T.Vector3());
  const sy=height/dims.y,sx=width*(tall?.68:wide?1.40:1.08)/Math.max(dims.x,dims.z),group=new T.Group();group.name=tall?'香樟':wide?'朴树':'榕树';
  const bark=tree.branchesMesh.geometry,leaves=tree.leavesMesh.geometry;
  for(const g of [bark,leaves]){g.scale(sx,sy,sx);g.translate(0,-bounds.min.y*sy,0)}
  unwrapAvenueBark(bark);
  const leafPos=leaves.attributes.position,leafNorm=leaves.attributes.normal,col=new Float32Array(leafPos.count*3),tint=new T.Color();
  for(let k=0;k<leafPos.count;k+=4){if(COURT){
      let cx=0,cy=0,cz=0;for(let j=k;j<k+4;j++){cx+=leafPos.getX(j)*.25;cy+=leafPos.getY(j)*.25;cz+=leafPos.getZ(j)*.25}
      const spread=1.30+.18*Math.sin(cx+cz);
      for(let j=k;j<k+4;j++)leafPos.setXYZ(j,cx+(leafPos.getX(j)-cx)*spread,cy+(leafPos.getY(j)-cy)*spread,cz+(leafPos.getZ(j)-cz)*spread);
    }
    const x=leafPos.getX(k),y=leafPos.getY(k),z=leafPos.getZ(k),shade=range(.87,1.12)*(.82+.18*y/height);
    tint.setRGB((tall?1.03:wide?1.17:1.02)*shade,(wide?1.22:1.09)*shade,(wide?.85:.92)*shade);
    const n=v3(x*.11,.88+y*.022,z*.11).normalize();
    for(let i=k;i<k+4;i++){col[i*3]=tint.r;col[i*3+1]=tint.g;col[i*3+2]=tint.b;leafNorm.setXYZ(i,n.x,n.y,n.z)}
  }
  leaves.setAttribute('color',new T.Float32BufferAttribute(col,3));
  group.add(joinAvenueTrunk(bark),new T.Mesh(bark,mats.liveBark),new T.Mesh(leaves,mats.liveLeaves));
  if(COURT){
    // 从树干下部顶点测出根颈中心与半径，用连续圆滑截面接到土坡。
    const v=bark.attributes.position,buf=[];
    for(let j=0;j<v.count;j++){const y=v.getY(j);if(y>.20&&y<.89)buf.push([v.getX(j),v.getZ(j)])}
    if(buf.length){
      const xs=buf.map(a=>a[0]).sort((a,b)=>a-b),zs=buf.map(a=>a[1]).sort((a,b)=>a-b),q=f=>Math.floor((buf.length-1)*f);
      const cx=(xs[q(.10)]+xs[q(.90)])*.5,cz=(zs[q(.10)]+zs[q(.90)])*.5;
      const rx=Math.max(.15,(xs[q(.90)]-xs[q(.10)])*.50),rz=Math.max(.15,(zs[q(.90)]-zs[q(.10)])*.50);
      const g=new T.CylinderGeometry(1,1,1,64,18,true),p=g.attributes.position,uv=g.attributes.uv;
      for(let j=0;j<p.count;j++){const x=p.getX(j),z=p.getZ(j),a=Math.atan2(z,x),t=p.getY(j)+.5;
        const ribs=Math.pow(.5+.5*Math.cos(7*a+.53*Math.sin(3*a+jitter)),2.6);
        const flare=(.18+.56*ribs)*Math.pow(1-t,3.2);
        p.setXYZ(j,cx+x*(rx*(1.04-.20*t)+flare),t*.70-.096,cz+z*(rz*(1.04-.20*t)+flare));uv.setXY(j,a*.34,t*.70);
      }g.computeVertexNormals();group.add(new T.Mesh(g,mats.liveBark));
    }
  }
  tree.branchesMesh.material.dispose();tree.leavesMesh.material.dispose();
  return group;
}

// 草地与石路共面。圆角边界在水平方向细微起伏，外缘的草尖自然越过接缝。
function grassBed(p,x,z,w,d,base,r,color){
  const poly=[],hw=w/2,hd=d/2;
  for(let k=0;k<4;k++){
    const a=k*Math.PI/2,cx=(k===0||k===3)?hw-r:-hw+r,cz=k<2?hd-r:-hd+r;
    for(let j=0;j<=18;j++){const t=a+j*Math.PI/36;poly.push([cx+r*Math.cos(t),cz+r*Math.sin(t)])}
  }
  const P=[],N=[],U=[],C=[],I=[],tint=new T.Color(color),outside=[];
  for(let k=0;k<poly.length;k++){const A=poly[k],B=poly[(k+1)%poly.length],l=Math.hypot(B[0]-A[0],B[1]-A[1]),count=Math.ceil(l/.16);
    for(let j=0;j<count;j++){const xx=mix(A[0],B[0],j/count),zz=mix(A[1],B[1],j/count);
      const n=(noise(xx*3.2+27,zz*3.3+12)-.48)*.095;outside.push([xx+(B[1]-A[1])/l*n,zz-(B[0]-A[0])/l*n]);}}
  const num=outside.length,bands=COURT&&p.name!=='中区大草坪'?2:9;for(let band=0;band<=bands;band++)for(let j=0;j<num;j++){
    const [a,b]=outside[j],t=band/bands,px=x+a*t,pz=z+b*t;let care=.98+.055*(noise(px*.33+3,pz*.46+5)-.5);
    P.push(px,base+.006+Math.sin(t*Math.PI)*.004,pz);N.push(0,1,0);U.push(px/3.1,pz/3.1);C.push(tint.r*care,tint.g*care,tint.b*care);
    if(band){const k=band*num+j,m=band*num+(j+1)%num;I.push(k,k-num,m,k-num,m-num,m)}
  }
  const g=new T.BufferGeometry();for(const [key,arr,n] of [['position',P,3],['normal',N,3],['uv',U,2],['color',C,3]])g.setAttribute(key,new T.Float32BufferAttribute(arr,n));g.setIndex(I);
  if(!p.bins.has('grass'))p.bins.set('grass',[]);p.bins.get('grass').push(g.toNonIndexed());g.dispose();
}
const grassCells=[];
function createGrass(){
  const rows=[],verts=[],norm=[],cols=[],idx=[],leaves=14;
  for(let j=0;j<leaves;j++){
    const a=j*2.39996+range(-.67,.67),dx=Math.cos(a),dz=Math.sin(a),r=range(.005,.054),x=r*dx,z=r*dz,h=range(.032,COURT?.092:.085),w=range(COURT?.0031:.0019,COURT?.0063:.0047),bend=h*range(.25,.64),i=verts.length/3;
    verts.push(x-dz*w,0,z+dx*w,x+dz*w,0,z-dx*w,x+dx*bend*.38-dz*w*.58,h*.64,z+dz*bend*.38+dx*w*.58,x+dx*bend*.38+dz*w*.58,h*.64,z+dz*bend*.38-dx*w*.58,x+dx*bend,h,z+dz*bend);
    for(let k=0;k<5;k++){norm.push(dx*.20,.96,dz*.20);let light=range(.82,1.17)*(.82+k*.065);if(COURT){const tip=k===4?1.46:k<2?.72:1.08;cols.push(light*tip,light*tip*.97,light*tip*.77)}else cols.push(.90*(.96+.05*light),.88*(.96+.05*light),.65*(.96+.05*light))}
    if(COURT)idx.push(i,i+3,i+1,i,i+4,i+3);else idx.push(i,i+2,i+1,i+1,i+2,i+3,i+2,i+4,i+3)
  }
  const geom=new T.BufferGeometry();for(const [key,arr,n] of [['position',verts,3],['normal',norm,3],['color',cols,3]])geom.setAttribute(key,new T.Float32BufferAttribute(arr,n));geom.setIndex(idx);
  geom.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geom.attributes.position.count*2),2));
  const mat=mats.grass.clone();mat.normalMap=null;
  mat.onBeforeCompile=shader=>{
    mats.grass.onBeforeCompile(shader);
    shader.vertexShader='varying float bladePresence;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      vec3 foot=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
      bladePresence=1.-smoothstep(4.,19.,distance(foot,cameraPosition));
      transformed.y*=bladePresence;
      vMapUv=(foot.xz+vec2(0.,1.8))/3.1;
    `);
    shader.fragmentShader='varying float bladePresence;\n'+shader.fragmentShader.replace('#include <normal_fragment_begin>',T.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;',''))
      .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(bladePresence<.04)discard;');
  };
  const group=new T.Group();group.name='草坪叶丛';const cell=4;
  for(let i=0;i<7;i++)for(let j=0;j<9;j++){
    const places=[];for(let k=0;k<(COURT?760:590);k++){const x=-14+i*cell+random()*cell,z=-19.8+j*cell+random()*cell;
      const r=lawnShape.radius,qx=Math.abs(x)-lawnShape.width/2+r,qz=Math.abs(z-LAYOUT.lawn[1]-lawnShape.offset)-lawnShape.length/2+r,edge=Math.hypot(Math.max(0,qx),Math.max(0,qz))+Math.min(0,Math.max(qx,qz))-r;
      if(edge>range(-.015,.065))continue;const damp=noise(x*.61+19,z*.54+51),height=(.67+.57*damp)*range(.65,1.25);
      places.push([x,z,height,range(0,6.28)]);
    }
    if(!places.length)continue;
    const m=new T.InstancedMesh(geom,mat,places.length);places.forEach(([x,z,v,a],n)=>{scratch.position.set(x,.010,z);scratch.scale.set(v,v,v);scratch.rotation.set(0,a,0);scratch.updateMatrix();m.setMatrixAt(n,scratch.matrix)});
    m.computeBoundingSphere();m.receiveShadow=true;group.add(m);grassCells.push([m,-12+i*cell,-17.8+j*cell,places.length]);
  }return group;
}

// 远林使用由本场景树木实拍渲染的透明图集，避免在远处逐片绘制树叶。
function createHorizon(){
  const group=new T.Group();group.name='远林与林地';const ground=new T.Mesh(new T.PlaneGeometry(900,900),mats.grass.clone());
  ground.material.vertexColors=false;ground.material.map=mats.grass.map.clone();ground.material.map.repeat.set(170,170);ground.material.color.set('#c1bd94');ground.rotation.x=-Math.PI/2;ground.position.y=-.05;ground.receiveShadow=true;group.add(ground);
  const resolution=384,copy=new T.Scene(),sunlight=sun.clone();sunlight.castShadow=false;copy.add(sky.clone(),sunlight);copy.environment=scene.environment;
  const proxyCam=new T.OrthographicCamera(-10,10,10,-10,.1,90),rt=new T.WebGLRenderTarget(resolution,resolution,{colorSpace:T.SRGBColorSpace});
  const old=renderer.getRenderTarget(),was=renderer.shadowMap.enabled;renderer.shadowMap.enabled=false;
  for(let k=0;k<3;k++){
    const base=createTree(['spreading','camphor','banyan'][k],true),tree=k===1?sampledCanopy(4,base):base;copy.add(tree);
    const bounds=new T.Box3().setFromObject(tree),center=bounds.getCenter(v3()),dim=bounds.getSize(v3()),span=Math.max(dim.x,dim.y)*.555;
    proxyCam.left=-span;proxyCam.right=span;proxyCam.top=span;proxyCam.bottom=-span;proxyCam.updateProjectionMatrix();
    proxyCam.position.set(center.x,center.y,25);proxyCam.lookAt(center.x,center.y,0);
    renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.render(copy,proxyCam);
    const bytes=new Uint8Array(resolution*resolution*4);renderer.readRenderTargetPixels(rt,0,0,resolution,resolution,bytes);
    let baseRow=0;
    if(COURT)for(let y=0;y<resolution;y++){let opaque=0;
      for(let x=resolution*.30|0;x<resolution*.70;x++)if(bytes[(y*resolution+x)*4+3]>136)opaque++;
      if(opaque>4){baseRow=y;break}
    }
    const tex=new T.DataTexture(bytes,resolution,resolution);tex.colorSpace=T.SRGBColorSpace;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;
    const m=new T.MeshBasicMaterial({map:tex,alphaTest:.38,side:T.DoubleSide,color:'#e0e4ce'}),g=new T.PlaneGeometry(1,1);
    const mesh=new T.InstancedMesh(g,m,144);
    for(let i=0;i<144;i++){let a=(i%48+random()*.8)*2*Math.PI/48+k*.06,ring=Math.floor(i/48),r=range(49,64)+ring*29;
      let sz=range(11,22),x=Math.cos(a)*r,z=Math.sin(a)*r*1.26;
      scratch.position.set(x,COURT?sz*(.5-baseRow/resolution)-.17:sz*.41-.2,z);scratch.scale.set(sz*range(.9,1.16),sz,1);scratch.rotation.set(0,-a+Math.PI/2,0);scratch.updateMatrix();mesh.setMatrixAt(i,scratch.matrix)}
    group.add(mesh);
    const lower=new T.InstancedMesh(g,m,80);
    for(let i=0;i<80;i++){let a=i*2.4+k*.71,r=range(49,74),sz=range(4.8,9);scratch.position.set(Math.cos(a)*r,sz*.29,Math.sin(a)*r*1.29);scratch.scale.set(sz*range(1.0,1.52),sz,1);scratch.rotation.set(0,-a+Math.PI/2,0);scratch.updateMatrix();lower.setMatrixAt(i,scratch.matrix)}
    group.add(lower);copy.remove(tree);tree.traverse(o=>o.geometry?.dispose());
  }
  renderer.setRenderTarget(old);renderer.shadowMap.enabled=was;rt.dispose();return group;
}

// 大王椰的叶轴、羽片中肋和两侧叶面分别建模，内外两层叶冠采用不同仰角。
// 圆柱展开后绘制皮孔、纵向纤维、断续的叶痕与地衣，避免平面投影拉伸树皮。
function palmBark(){
  const map=texture((c,s)=>{
    const im=c.createImageData(s,s);
    for(let y=0;y<s;y++)for(let x=0;x<s;x++){let u=x/s,v=y/s;
      let warp=noise(u*4,v*6,8),fib=noise(u*128+warp*3.4,v*16,128),m=noise(u*16,v*16,16),l=noise(u*4,v*4,4),g=random();
      let moss=Math.max(0,noise(u*17,v*28)*.58+l*.42-.48)*65;
      let q=110+13*l+17*(m-.5)+32*(fib-.5)+26*(g-.5);

      im.data.set([q+8-moss,q+5+moss*.8,q-7-moss*.25,255],4*(y*s+x))}
    c.putImageData(im,0,0);
    for(let i=0;i<65;i++){
      const y=(i+random()*.6)/66*s;let x=range(-.3,.85)*s,len=range(.19,.95)*s;
      c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+.25*len,y+range(-3,4),x+.67*len,y+range(-4,4),x+len,y+range(-2,3));
      c.lineWidth=range(.55,1.8);c.strokeStyle=choose(['#494e394e','#d2c8a862','#76795a59']);c.stroke();
    }
    for(let i=0;i<3900;i++){const x=range(0,s),y=range(0,s);c.fillStyle=choose(['#46473732','#c1b99f44','#8e916544','#575a4b48']);c.fillRect(x,y,range(.5,2.5),range(.5,3.4))}
  },512);
  return new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.019,roughness:.80,vertexColors:true});
}
function palmTrunk(p,h,lx,lz,age){
  const positions=[],uv=[],indices=[],colors=[],rings=80,sides=30,wave=range(0,6.28);
  for(let j=0;j<=rings;j++){
    const t=j/rings,base=.147+.17*Math.exp(-9*t)+.106*Math.exp(-Math.pow((t-.40)/.25,2))+.019*Math.sin(Math.PI*t);
    for(let k=0;k<=sides;k++){const a=k/sides*6.2831853,edge=.73+.06*Math.cos(a+wave)+.02*Math.sin(3*a+.8);
      const trans=T.MathUtils.smoothstep(t,edge-.11,edge+.095),r=age*(base+(COURT?(.17+.055*Math.cos(7*a+wave))*Math.exp(-46*t):0)-.023*trans+.006*Math.sin(t*18+wave+a)+.005*Math.cos(3*a)*Math.exp(-3*t));
      positions.push(lx*t*t+r*Math.cos(a),h*t,lz*t*t+r*Math.sin(a));uv.push(k/sides,t);
      const col=new T.Color('#d5ceba').lerp(new T.Color('#a2ac88'),trans);col.multiplyScalar(.79+.17*T.MathUtils.smoothstep(t,0,.19)+.045*Math.sin(a+wave));colors.push(col.r,col.g,col.b);
      if(j&&k){let d=j*(sides+1)+k;indices.push(d-sides-2,d,d-sides-1,d-sides-2,d-1,d)}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  if(!p.bins.has('palmSkin'))p.bins.set('palmSkin',[]);p.bins.get('palmSkin').push(g.toNonIndexed());g.dispose();
}
function bench(p,x,z,s){
  const wood=['#99774e','#a58256','#95734d','#aa8459','#9e7a50'],iron='#4e6259';
  for(let i=0;i<5;i++)p.box(x+(i-2)*.103,.54,z,.088,.056,1.84,wood[i],'wood');
  for(let i=0;i<3;i++)p.box(x+s*(.225+i*.026),.72+i*.108,z,.055,.091,1.84,wood[4-i],'wood',[0,0,-s*.13]);
  for(const end of [-1,1]){
    const zz=z+end*.68;
    p.rod([x-.18,.05,zz],[x-.128,.486,zz],.036,.03,iron,9);p.rod([x+.18,.05,zz],[x+.125,.49,zz],.036,.03,iron,9);
    p.rod([x-.21,.49,zz],[x+.213,.49,zz],.034,.034,iron,9);p.rod([x+s*.17,.48,zz],[x+s*.275,.97,zz],.027,.026,iron,9);
    for(const sign of [-1,1])p.box(x+sign*.182,.04,zz,.105,.04,.112,iron);
    for(let j=0;j<3;j++)p.rod([x+s*(.225+j*.026),.72+j*.108,zz],[x+s*(.19+j*.026),.72+j*.108,zz],.014,.014,'#716b57',9);
  }
}

// 叶枕、叶轴和羽片共用一条连续弧线。羽片横向弯折，背光时仍保留断续透空。
function createPalm(){
  const p=new Part('大王椰'),h=range(7.2,10.15),lx=range(-.92,.92),lz=range(-.56,.56),age=range(.8,1.11);
  palmTrunk(p,h,lx,lz,age);
  const pos=[],uv=[],cols=[],indices=[],nx=12,ny=32;
  const stage=random(),leafCount=Math.floor(11+stage*13+range(-1,2)),vigor=.70+stage*.54,upright=.61-stage*.44,sag=.60+stage*.62,gap=range(0,6.28);
  for(let k=0;k<leafCount;k++){
    let a=k*2.399+gap+range(-.54,.54),len=range(2.65,4.25)*vigor,sweep=range(-.47,.47),high=random()<upright;
    const reach=high?range(.54,.76):range(.81,.98),lift=high?range(.55,.86):range(.27,.48),drop=high?range(.34,.76):range(.53,1.04)*sag,twist=range(-.71,.71);
    const base=pos.length/3,light=range(.78,1.15);
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const t=j/ny,u=i/nx*2-1,ang=a+sweep*t*t,xr=len*reach*t,wide=len*.24*u,roll=twist*Math.sin(t*Math.PI);
      const height=h-.11+len*(lift*Math.sin(t*2.08)-drop*t*t*.67)-Math.abs(u)**1.48*len*.124+wide*Math.sin(roll);
      pos.push(lx+Math.cos(ang)*xr-Math.sin(ang)*wide*Math.cos(roll),height,lz+Math.sin(ang)*xr+Math.cos(ang)*wide*Math.cos(roll));
      uv.push(i/nx,t);const v=light*(.84+.21*t+.04*u);const old=k>leafCount-3&&stage>.63;cols.push(v*(old?1.20:.96),v*(old?.83:1.),v*(old?.67:.95));
      if(i&&j){const q=base+j*(nx+1)+i;indices.push(q-nx-2,q-1,q,q-nx-2,q,q-nx-1)}
    }
    const ac=[Math.cos(a),Math.sin(a)];
    p.rod([lx-ac[0]*.04,h-.42,lz-ac[1]*.04],[lx+ac[0]*.36,h-.11+len*lift*.25,lz+ac[1]*.36],.061,.031,'#819061',12);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setIndex(indices);g.computeVertexNormals();
  const n=g.attributes.normal;for(let i=0;i<n.count;i++){
    const sign=n.getY(i)<0?-1:1;n.setXYZ(i,n.getX(i)*sign*.60,.4+.60*n.getY(i)*sign,n.getZ(i)*sign*.60)}
  const group=p.finish();group.add(new T.Mesh(g,mats.frond));return group;
}

function azalea(p,x,y,z,scale){
  const stem='#72744a',tint=choose(['#e4a297','#eac1ae','#cc807b','#e7b49d']);
  for(let j=0;j<4;j++){
    const q=j*2.39,xx=x+Math.cos(q)*.062*scale,zz=z+Math.sin(q)*.062*scale,yy=y+range(-.02,.055);
    p.rod([x,y-.07*scale,z],[xx,yy,zz],.009,.005,stem,4);
    for(let k=0;k<5;k++){let a=k*Math.PI*.4+q,l=.043*scale,w=.023*scale;
      const pt=(r,s,h)=>[xx+Math.cos(a)*r-Math.sin(a)*s,yy+h,zz+Math.sin(a)*r+Math.cos(a)*s];
      const base=pt(0,0,0),lft=pt(l*.64,-w,.009),rgt=pt(l*.64,w,.009),end=pt(l,0,.005),mid=pt(l*.63,0,.016);
      p.surface([base,lft,mid,lft,end,mid,base,mid,rgt,mid,end,rgt],tint);
    }
    p.add(ball,'#d4b563',[xx,yy+.006,zz],[.011,.011,.011]);
  }
}

const addShrub=shrubLeaves;
function createFurniture(){
  const p=new Part('长椅、路灯与花圃');
  for(const s of [-1,1])for(const z of (COURT?[-17,-5,8]:[-17,-5,8,21,32])){
    const x=s*14.6;p.rod([x,.05,z],[x,3.85,z],.09,.057,'#40594c');p.rod([x,0,z],[x,.42,z],.17,.13,'#536052');
    p.rod([x,3.7,z],[x,4.08,z],.15,.24,'#e5d8ac',6);p.rod([x,4.09,z],[x,4.29,z],.28,.035,'#4e6354',6);
    const bx=s*12.9,bz=z+1.7;
    bench(p,bx,bz,s);
  }
  for(let i=0;i<600;i++){const side=i%2?1:-1,center=choose([-16,-4,9,24,33]),x=side*range(12.35,15.05),z=center+range(-3.1,3.1),y=.033;
    const a=range(0,Math.PI*2),len=range(.033,.092),w=len*range(.22,.39),dx=Math.cos(a),dz=Math.sin(a);
    p.surface([[x,y,z],[x+dx*len*.5-dz*w,y+.009,z+dz*len*.5+dx*w],[x+dx*len,y+.002,z+dz*len],[x,y,z],[x+dx*len,y+.002,z+dz*len],[x+dx*len*.47+dz*w,y+.007,z+dz*len*.47-dx*w]],choose(['#98805e','#a18d63','#8b7956','#b2976d']))}
  if(!COURT)for(const sign of [-1,1])for(let i=0;i<13;i++){let x=sign*(6.8+i*.38),z=18.6+.7*Math.sin(i/4);addShrub(p,x,.38,z,.54);for(let j=0;j<3;j++)azalea(p,x+range(-.21,.21),range(.65,.88),z+range(-.23,.23),range(.84,1.2))}
  for(const sign of [-1,1])for(const [x,z,r] of [[5.8,19,1.05],[5.65,34.8,.83],[5.65,36,.8],[5.65,33.6,.76],[8.6,-20.6,.85]]){
    addShrub(p,x*sign,r*.54,z,r);
  }
  return p.finish();
}
// 从六株不同的三维树离线采样枝叶轮廓，与原有榕树、香樟和朴树穿插种植。

function sampledCanopy(id,template){
  const field=CANOPY_FIELDS[id],box=new T.Box3().setFromObject(template),h=box.max.y;
  const g=new T.PlaneGeometry(h*field.w/field.h,h,18,22),pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){
    const v=g.attributes.uv.getY(i),u=g.attributes.uv.getX(i);
    pos.setXYZ(i,pos.getX(i),pos.getY(i)+h/2,(1-(2*u-1)**2)*Math.sin(Math.PI*v)*.087*h);
  }
  g.computeBoundingSphere();const group=new T.Group();group.name='分枝树冠';
  group.add(new T.Mesh(g,new T.MeshBasicMaterial({map:fieldTexture(field),alphaTest:.41,side:T.DoubleSide})));return group;
}
function createPlanting(){
  const group=new T.Group();group.name='岭南植被';const batches=[];
  for(let i=0;i<14;i++){
    const species=['camphor','banyan','spreading','banyan','camphor','spreading'][i],before=seed,template=i<6?createTree(species):createPalm(),after=seed;
    let low=null;if(i<6){seed=before;low=createTree(species,true);seed=after}batches.push({template,low,places:[]})
  }
  let speciesStep=0;const speciesOrder=[0,5,1,4,2,3,1,5,4,3,2,0];
  const place=(x,z,type,scale)=>{const b=type==='palm'?6+Math.floor(random()*8):type==='flowers'?5:speciesOrder[speciesStep++%speciesOrder.length];batches[b].places.push([x,z,scale,range(0,6.28)])};
  for(const s of [-1,1]){
    for(const z of [-40,-34,-25,-18,-10,-2,6.5,15,24,32.5,40])place(s*range(28.2,29.8),z,'tree',range(.82,1.19));
    for(const [j,z] of [-18,-7.5,4.8,16].entries()){
      const scale=([.84,1.08,.74,1.03][(j+(s>0?1:0))%4])*range(.91,1.12);
      const palm=j===(s<0?1:2), b=palm?6+(s<0?j:4+j):[1,4,3,0][(j+(s<0?1:0))%4];
      const x=range(15.7,16.95),dz=range(-1.6,1.6),rotation=range(0,6.28);
      const spacing=s>0&&j===0?2.3:s<0&&j===0?1.2:0;
      batches[b].places.push([s*(x+spacing),z+dz,palm?scale:j===0?1.17:scale*1.12,rotation])
    }
    for(const z of [-40,-21,11.4,26,41])place(s*range(17,19),z,z===11.4?'flowers':'tree',range(.7,.94));
    for(const z of [-17,23.5,38])place(s*range(22,26),z,'tree',range(.69,.93));
    place(s*(s<0?18.1:21.4),s<0?-26.7:-30.2,'tree',s<0?.82:.76);place(s*11.2,-38.2,'palm',1);place(s*(s<0?6.2:7.4),-40.6,'tree',s<0?1.46:1.56);
    // 两株庭前乔木分处前坪两侧，树干退到林带里，冠缘伸向草坪。
    batches[s<0?3:0].places.push([s*(s<0?13.2:15.85),s<0?-22.7:-25.6,s<0?1.18:1.25,s<0?.73:1.18]);
    if(COURT)batches[s<0?0:2].places.push([s*(s<0?12.1:11.85),s<0?-12.7:-17.8,s<0?1.04:.96,s<0?2.3:1.63]);
  }
  for(let i=0;i<39;i++){const a=i*2.399,rr=range(39,48);place(Math.cos(a)*rr,Math.sin(a)*rr*1.36,'tree',range(.65,1.26))}
  for(const batch of batches){for(const pos of batch.places){const [x,z]=pos;
    if(batch.template.name==='大王椰'&&x>0&&Math.abs(x+z-19)<3.1)pos[1]+=4.4;
    if(batch.template.name==='大王椰'&&x<0&&Math.abs(z-x-35)<2.8)pos[1]-=3.5
  }}
  for(const batch of batches){
    if(!batch.places.length)continue;
    function layers(template){
      return template.children.map(child=>{const mesh=new T.InstancedMesh(child.geometry,child.material,batch.places.length);mesh.name=template.name;
        mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;group.add(mesh);return mesh})
    }
    const near=layers(batch.template),far=batch.low?layers(batch.low):[],sample=batch.low?layers(sampledCanopy(batches.indexOf(batch),batch.template)):[],instances=batch.places.map(([x,z,scale,a])=>{
      scratch.position.set(x,COURT?-.075:.078,z);scratch.scale.setScalar(scale);scratch.rotation.set(0,a,0);scratch.updateMatrix();return {x,z,m:scratch.matrix.clone(),angle:a,scale,sampled:(z< -31&&x>1&&x<23)||noise(x*2.71+13,z*1.7)>.45,near:null}
    });if(COURT)for(const mesh of [...far,...sample])mesh.castShadow=false;treeBatches.push({near,far,sample,instances});
  }
  if(COURT){
    // 根部的林下遮蔽烘在地面上。透明边缘沿草土过渡消退，远近树共用一批。
    const shadow=texture((g,n)=>{
      const image=g.createImageData(n,n);
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const x=(i+.5)/n*2-1,z=(j+.5)/n*2-1,r=Math.hypot(x,z);
        const a=Math.max(0,1-r)**1.65,grain=noise(8*x+21,8*z+43);
        image.data.set([56+grain*22,48+grain*18,28+grain*10,Math.round(247*a)],4*(j*n+i));
      }g.putImageData(image,0,0);
    },128);
    const places=treeBatches.flatMap(b=>b.instances).filter(t=>Math.abs(t.x)<32&&Math.abs(t.z)<44);
    const landings=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:shadow,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),places.length);
    places.forEach((t,i)=>{scratch.position.set(t.x,.026,t.z);scratch.rotation.set(-Math.PI/2,0,t.angle);scratch.scale.set(t.scale*3.6,t.scale*3.13,1);scratch.updateMatrix();landings.setMatrixAt(i,scratch.matrix)});
    landings.name='树根附近的湿土与地面遮蔽';landings.renderOrder=1;group.add(landings);
  }
  updateTrees(true);return group;
}
const treeBatches=[];let lastTreeEye=new T.Vector3(999,999,999);
function updateTrees(force=false){
  if(!camera||(!force&&lastTreeEye.distanceToSquared(camera.position)<3.2))return;
  lastTreeEye.copy(camera.position);
  for(const [mesh,x,z,count] of grassCells){const dist=Math.hypot(camera.position.x-x,camera.position.z-z,camera.position.y*.66);
    const walk=walker?.active;
    mesh.count=walk?Math.round(count*(COURT?.82:.55)*Math.max(0,1-dist/(COURT?12.6:10))):dist>21?0:dist>15?Math.round(count*.52):count;mesh.visible=!!mesh.count}

  for(const b of treeBatches){let n=0,f=0,s=0,changed=false;
    for(const q of b.instances){const dist=Math.hypot(q.x-camera.position.x,q.z-camera.position.z,.57*camera.position.y);
      const close=!b.far.length||dist<((COURT&&Math.abs(q.x)<16.1&&q.z<-9&&q.z>-27)?21:(q.near?13.7:11.7));
      if(q.near!==close)changed=true;q.near=close;
    }
    if(!changed&&!force&&!b.far.length)continue;
    for(const q of b.instances){const list=q.near?b.near:q.sampled?b.sample:b.far,i=q.near?n++:q.sampled?s++:f++;let mat=q.m;
      if(!q.near){scratch.position.set(q.x,COURT?-.13:.066,q.z);scratch.scale.set(q.scale*(Math.cos(q.angle)>.3?-1:1)*(.91+.13*Math.sin(q.angle*2.5)),q.scale*(.97+.09*Math.cos(q.angle*1.8)),q.scale);scratch.rotation.set(0,Math.atan2(camera.position.x-q.x,camera.position.z-q.z),0);scratch.updateMatrix();mat=scratch.matrix}
      for(const obj of list)obj.setMatrixAt(i,mat)}
    for(const [list,count] of [[b.near,n],[b.far,f],[b.sample,s]])for(const mesh of list){mesh.count=count;mesh.visible=!!count;mesh.instanceMatrix.needsUpdate=true}
  }
}

function add(key,group,position=[0,0]){group.position.set(position[0],0,position[1]);scene.add(group);components[key]=group}
let renderer,camera,controls,sun,sky,flight,active=-1,showTags=false,morning=false,dirty=true;
let w=1,h=1,overviewSpan=95,ready=false,lastCameraUpdate=0;
const viewport=$('viewport'),stage=viewport.parentElement;
const v3=(x,y,z)=>new T.Vector3(x,y,z);
let daySky,mistSky;
function lighting(){
  sky=new T.HemisphereLight(0xd4e6fa,0x6a6753,.78);scene.add(sky);
  sun=new T.DirectionalLight(0xffe3bd,3.02);sun.position.set(-44,56,21);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-54,right:54,top:58,bottom:-58,near:.4,far:159});
  sun.shadow.mapSize.set(3072,3072);sun.shadow.radius=1.65;sun.shadow.bias=-.00034;sun.shadow.normalBias=.032;sun.shadow.camera.updateProjectionMatrix();scene.add(sun);
  if(COURT){
    sky.color.setHex(0xdce9f3);sky.groundColor.setHex(0x9a9485);sky.intensity=1.05;
    sun.target.position.set(0,3,-22);sun.position.set(-30,33,-1);scene.add(sun.target);
    Object.assign(sun.shadow.camera,{left:-24,right:24,top:22,bottom:-22,far:94});sun.shadow.normalBias=.012;sun.shadow.bias=-.00015;sun.shadow.camera.updateProjectionMatrix();
    sun.color.setHex(0xffedce);sun.intensity=2.72;
  }
  daySky=skyMap(false);scene.background=scene.environment=daySky;
  scene.backgroundIntensity=.97;scene.fog=new T.FogExp2(0xb5c8c5,.00465);
}
function sunMode(){
    morning=!morning;$('light').querySelector('span').textContent=morning?'清晨薄雾':'午后晴光';
  if(morning&&!mistSky)mistSky=skyMap(true);scene.background=scene.environment=morning?mistSky:daySky;
  sky.color.set(morning?0xddeeff:0xe0edff);sun.color.set(morning?0xffe1c6:0xffe5bc);sun.intensity=morning?1.8:3.02;
  sun.position.set(morning?51:-44,morning?34:56,morning?26:21);scene.fog.color.set(morning?0xc9d7d3:0xafc5c7);scene.fog.density=morning?.018:.0074;
    if(COURT){sun.position.set(morning?34:-30,morning?27:33,morning?-3:-1);sky.intensity=morning?1.22:1.05;sun.intensity=morning?1.65:2.72;sun.color.setHex(morning?0xffe4ce:0xffedce);scene.fog.density=morning?.0105:.00465}
  renderer.shadowMap.needsUpdate=true;dirty=true;
}
function resize(){
  const wasPortrait=w/h<.85;
  w=viewport.clientWidth;h=viewport.clientHeight;if(!w||!h)return;
  const aspect=w/h;
  camera.aspect=aspect;camera.fov=walker?.active?walker.fov():aspect<.85?55:44;
  camera.updateProjectionMatrix();renderer.setSize(w,h,false);dirty=true;
  if(ready&&!walker?.active&&active===-1&&wasPortrait!==(aspect<.85))setView(-1,true);
}
function applyCamera(pos,target,zoom){
  camera.position.copy(pos);controls.target.copy(target);camera.zoom=zoom;camera.updateProjectionMatrix();controls.update();dirty=true;
}
function setView(index,immediate=false){
  walker?.leave(false);
  active=index;let target=v3(0,5.7,-23.2),offset=v3(7.8,-.7,33.2),zoom=1;
  if(COURT){const s=stops[Math.max(0,index)];target=v3(...s.point);offset=v3(...s.eye);if(index<0){target.set(.25,5.33,-23.45);offset.set(-5.9,-2.91,23.5)}}
  else if(index>=0){const s=stops[index],pos=LAYOUT[s.key];target=v3(pos[0],s.look,pos[1]);offset=v3(...s.eye)}
  if(w/h<.85){offset.x*=1.6;offset.z*=1.65}

    let destination=target.clone().add(offset);
  if(immediate||matchMedia('(prefers-reduced-motion: reduce)').matches){flight=null;applyCamera(destination,target,zoom)}
  else flight={time:performance.now(),p:camera.position.clone(),t:controls.target.clone(),z:camera.zoom,end:destination,focus:target,zoom};
  $('viewName').textContent=index<0?(COURT?'怀士堂庭院':'中轴远眺'):stops[index].name;$('detail').textContent=index<0?'':stops[index].text;
  document.querySelectorAll('.stop').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));dirty=true;
}
function zoomBy(scale){if(walker?.active){walker.zoom(scale);return}flight=null;const offset=camera.position.clone().sub(controls.target);offset.setLength(T.MathUtils.clamp(offset.length()/scale,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();dirty=true}
function labelPositions(){
  const occupied=[];
  document.querySelectorAll('.label').forEach((el,i)=>{
    const s=stops[i],pos=LAYOUT[s.key];const nearSubject=active===i&&camera.position.distanceTo(controls.target)<6.5;
    let point=(COURT?v3(...s.point):v3(pos[0],nearSubject?Math.min(s.height,s.look+.71):s.height,pos[1])).project(camera);
    const x=(point.x+1)*w/2,y=(1-point.y)*h/2-18;
    const width=[81,110,110,73][i];
    let visible=showTags&&(active<0||active===i)&&point.z>-1&&point.z<1&&x>width/2&&x<w-width/2&&y>60&&y<h-43;
    if(visible&&occupied.some(a=>Math.abs(a.x-x)<(a.width+width)/2+2&&Math.abs(a.y-y)<30))visible=false;
    el.hidden=!visible;el.style.display=visible?'flex':'none';if(visible){el.style.left=x+'px';el.style.top=y+'px';occupied.push({x,y,width})}
  });
  const a=v3(0,0,0).project(camera),b=v3(0,0,1).project(camera);
  $('needle').style.transform='rotate('+Math.atan2((b.x-a.x)*w,(b.y-a.y)*h)+'rad)';
}
// 读深度缓冲重建视空间位置，分别估算窄接缝和大构件的遮蔽。仅场景发生变化时运行。
function ambientPass(){
  const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true,samples:renderer.capabilities.isWebGL2?2:0});
  target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);target.texture.colorSpace=T.LinearSRGBColorSpace;
  const post=new T.Scene(),ortho=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const uniforms={colorTex:{value:target.texture},depthTex:{value:target.depthTexture},invP:{value:new T.Matrix4()},proj:{value:new T.Matrix4()},size:{value:new T.Vector2()}};
  const m=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`uniform sampler2D colorTex,depthTex;uniform mat4 invP,proj;uniform vec2 size;varying vec2 tex;
    vec3 pos(vec2 uv,float d){vec4 p=invP*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
    float occlusion(vec3 p,vec3 n,float rad,float phase){
      vec2 extent=vec2(proj[0][0],proj[1][1])*(rad*.5/max(.1,-p.z));float sum=0.;
      for(int i=0;i<10;i++){float t=(float(i)+.5)/10.,a=float(i)*2.39996+phase;
        vec2 t2=clamp(tex+vec2(cos(a),sin(a))*extent*sqrt(t),vec2(.001),vec2(.999));
        vec3 delta=pos(t2,texture2D(depthTex,t2).r)-p;float len=length(delta);
        sum+=max(0.,dot(n,delta)/max(.0001,len)-.07)*(1.-smoothstep(rad*.24,rad*1.6,len));}
      return sum*.1;
    }
    void main(){float d=texture2D(depthTex,tex).r;vec3 c=texture2D(colorTex,tex).rgb;
      if(d<.99996){vec3 p=pos(tex,d);vec3 normal=normalize(cross(dFdx(p),dFdy(p)));if(normal.z<0.)normal=-normal;
        float o=occlusion(p,normal,.47,.17)*1.18+occlusion(p,normal,1.9,1.43)*.78;
        c*=max(vec3(.53,.55,.58),1.-o*vec3(1.15,1.07,.92));
      }
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  post.add(new T.Mesh(new T.PlaneGeometry(2,2),m));
  return ()=>{const sz=renderer.getDrawingBufferSize(uniforms.size.value);if(target.width!==sz.x||target.height!==sz.y)target.setSize(sz.x,sz.y);
    uniforms.invP.value.copy(camera.projectionMatrixInverse);uniforms.proj.value.copy(camera.projectionMatrix);
    renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(post,ortho)};
}

let drawFrame,settleAt=0,walker;
function tick(now){
  if(document.hidden||!ready)return;
  if(walker?.active){
    const gap=now-lastCameraUpdate;
    slowFrames=gap>27&&gap<350?slowFrames+1:Math.max(0,slowFrames-1);
    if(slowFrames>10&&renderer.getPixelRatio()>.62){renderer.setPixelRatio(Math.max(.62,renderer.getPixelRatio()-.13));slowFrames=0}
    lastCameraUpdate=now;walker.tick(now);camera.updateMatrixWorld();updateTrees();renderer.setRenderTarget(null);renderer.render(scene,camera);labelPositions();dirty=true;return;
  }
  if(flight){const f=flight,t=Math.min(1,(now-f.time)/850),s=t*t*(3-2*t);applyCamera(f.p.clone().lerp(f.end,s),f.t.clone().lerp(f.focus,s),f.z+(f.zoom-f.z)*s);if(t===1)flight=null}
  controls.update();
  if(!dirty&&settleAt&&now>=settleAt){settleAt=0;camera.updateMatrixWorld();drawFrame()}
  if(dirty){camera.updateMatrixWorld();updateTrees();
    // 持续移动使用单次抗锯齿前向渲染。停下后恢复带双尺度环境遮蔽的完整画面。
    const moving=lastCameraUpdate&&now-lastCameraUpdate<85&&!renderer.shadowMap.needsUpdate;
    if(moving){renderer.setRenderTarget(null);renderer.render(scene,camera);settleAt=now+100}
    else{drawFrame();settleAt=0}
    labelPositions();dirty=false;
    // 连续交互时检测过慢的帧，降低像素比；静止时完全停止绘制。
    if(lastCameraUpdate&&now-lastCameraUpdate>30&&now-lastCameraUpdate<180){slowFrames++}else{slowFrames=Math.max(0,slowFrames-1)}
    if(slowFrames>8&&renderer.getPixelRatio()>.76){renderer.setPixelRatio(Math.max(.75,renderer.getPixelRatio()-.15));dirty=true;slowFrames=0}lastCameraUpdate=now;
  }
}
let slowFrames=0;
function bindUI(){
  stops.forEach((s,i)=>{
    const no=String(i+1).padStart(2,'0'),button=document.createElement('button');button.className='stop';
    button.innerHTML='<b>'+no+'</b><strong>'+s.name+'</strong><svg class="icon"><use href="#arrow"/></svg>';button.onclick=()=>setView(i);document.querySelector('.routes').append(button);
    const label=document.createElement('button');label.className='label';label.innerHTML='<b>'+no+'</b>'+s.name;label.onclick=()=>setView(i);$('labels').append(label);
  });
  $('reset').onclick=()=>setView(-1);$('light').onclick=sunMode;
  $('tags').onclick=()=>{showTags=!showTags;$('tags').setAttribute('aria-pressed',String(showTags));dirty=true};
  $('plus').onclick=()=>zoomBy(1.25);$('minus').onclick=()=>zoomBy(.8);
  const can=renderer.domElement;can.tabIndex=0;can.setAttribute('aria-label','三维校园，可用方向键平移和加减键缩放');controls.listenToKeyEvents(can);
  can.addEventListener('keydown',e=>{flight=null;if(['+','='].includes(e.key))zoomBy(1.2);if(e.key==='-')zoomBy(1/1.2)});
  controls.addEventListener('start',()=>{flight=null;can.focus({preventScroll:true});active=-1;$('viewName').textContent='自由漫游';$('detail').textContent='';document.querySelectorAll('.stop').forEach(b=>b.setAttribute('aria-pressed','false'))});
  controls.addEventListener('change',()=>{
    if(walker?.active)return;const t=controls.target,limits=v3(T.MathUtils.clamp(t.x,COURT?-15:-33,COURT?15:33),T.MathUtils.clamp(t.y,.1,15),T.MathUtils.clamp(t.z,COURT?-34:-47,COURT?0:47));
    camera.position.add(limits.clone().sub(t));t.copy(limits);camera.position.y=Math.max(.78,camera.position.y);dirty=true;
  });
  new ResizeObserver(resize).observe(viewport);
}
$('help').onclick=()=>$('guide').showModal();
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('fullBtn').title='当前浏览器不支持全屏'}};
document.addEventListener('fullscreenchange',()=>{$('fullBtn').querySelector('span').textContent=document.fullscreenElement?'退出全屏':'全屏'});
const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
async function progress(n,text){$('meter').value=n;$('loadingText').textContent=text+' · '+n+'%';await paint()}
async function init(){
  try{
    await progress(window.campusWeb?15:4,'准备画布');
    renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setClearColor(0,0);
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.97;
    viewport.append(renderer.domElement);camera=new T.PerspectiveCamera(44,1,.09,480);
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.screenSpacePanning=false;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.565;controls.minDistance=1.7;controls.maxDistance=121;
    lighting();createMaterials();if(COURT){configureCourt();await installCourtMaterials();controls.maxDistance=43}await progress(18,'铺设草坪与步道');
    add('ground',createGround());add('lawn',createLawn(),LAYOUT.lawn);
    await progress(35,'砌筑怀士堂');seed=27183;add('hall',createHall(),LAYOUT.hall);
    if(COURT){await progress(49,'安装门廊、花窗与石阶');add('courtDetail',courtDetail(),LAYOUT.hall);add('courtLandscape',courtLandscape())}
    else{await progress(49,'安置铜像与惺亭');add('statue',createStatue(),LAYOUT.statue);add('pavilion',createPavilion(),LAYOUT.pavilion);add('pavilionHedge',createPavilionHedge(),LAYOUT.pavilion)}
    for(const [i,x,z,w,d,k,rot] of [[1,-23,-29,12,6.4,2,Math.PI/2],[2,23,-5,12.8,6,2,-Math.PI/2],[3,-23,1,14,6.5,2,Math.PI/2],[4,23,20,9.4,5.8,1,-Math.PI/2],[5,23,-31,10.4,6.5,1,0]]){
      let lodge=createLodge('林间红楼 '+i,w,d,k);lodge.rotation.y=rot;add('lodge'+i,lodge,[x,z]);
    }
    await progress(67,'种植榕树与大王椰');seed=921531;add('planting',createPlanting());add('horizon',createHorizon());add('blades',createGrass());add('furniture',createFurniture());
    await progress(87,'计算光影');resize();bindUI();$('tags').setAttribute('aria-pressed','false');setView(-1,true);for(const k of ['lawn','ground','horizon','blades'])components[k].traverse(o=>o.castShadow=false);
    renderer.shadowMap.needsUpdate=true;reflectionProbe(window.campusWeb?await window.campusWeb.probes:null);if(COURT)useCourtIrradiance();drawFrame=ambientPass();drawFrame();labelPositions();
    walker=makeWalker({T,scene,camera,controls,renderer,components,treeBatches,LAYOUT,reset:()=>setView(-1,true),
      entering:()=>{flight=null;active=-1;settleAt=0;document.querySelectorAll('.stop').forEach(b=>b.setAttribute('aria-pressed','false'));$('detail').textContent=''},
      redraw:()=>{dirty=true}});$('actorButton').disabled=false;
    await progress(100,'校园已就绪');$('load').hidden=true;ready=true;renderer.setAnimationLoop(tick);
    // 可在开发者控制台通过 campus.components 直接访问或替换独立组件。
    if(window.campusWeb&&COURT)window.campusWeb.refine(()=>{dirty=true});
    window.campus={scene,camera,controls,renderer,components,walker,setView,refresh(){renderer.shadowMap.needsUpdate=true;dirty=true}};
  }catch(e){console.error(e);$('load').querySelector('strong').textContent='三维场景未能启动';$('meter').hidden=true;$('loadingText').textContent='请开启浏览器图形加速，再刷新网页。'}
}
init();

})().catch(e=>{console.error(e);window.campusWeb.fail()});