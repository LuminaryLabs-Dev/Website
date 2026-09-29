/* One catalog for page categories, previews, sources and rendering budgets. */
(() => {
  const version='20260922-library-3';
  const scene=(id,name,category,source,poster,budgets=[640000,400000,260000],input=null)=>Object.freeze({id,name,category,source:`${source}?v=${version}`,poster:`${poster}?v=${version}`,budgets,input});
  const categories=[['home','Welcoming technology'],['arcade','Gaming'],['opensource','Fractals'],['services','Building systems'],['portfolio','Exhibits'],['team','Collaboration'],['contact','Connections']];
  const entries=[
    scene('soft-hallway','Soft hallway','home','/assets/shaders/luminary-hallway.glsl','/public/home/luminary-hallway-poster.webp',[921600,480000,260000]),
    scene('arcade-machines','Arcade machines','arcade','/assets/shaders/arcade-infinite.glsl','/public/scenes/arcade-infinite.webp'),
    scene('assembly-bench','Assembly bench','services','/assets/shaders/services-branches.glsl','/public/scenes/services-branches.webp'),
    scene('sculpture-gallery','Sculpture gallery','portfolio','/assets/shaders/portfolio-terraces.glsl','/public/scenes/portfolio-terraces.webp'),
    scene('shared-ideas','Shared ideas','team','/assets/shaders/team-chambers.glsl','/public/scenes/team-chambers.webp',[640000,400000,260000],'orbit'),
    scene('connected-nodes','Connected nodes','contact','/assets/shaders/contact-scene.glsl','/public/scenes/contact-scene.webp',[260000,190000,130000])
    ,scene('light-atrium','Light atrium','home','/assets/shaders/light-atrium.glsl','/public/scenes/light-atrium.webp')
    ,scene('pinball-lounge','Pinball lounge','arcade','/assets/shaders/pinball-lounge.glsl','/public/scenes/pinball-lounge.webp')
    ,scene('signal-foundry','Signal foundry','services','/assets/shaders/signal-foundry.glsl','/public/scenes/signal-foundry.webp')
    ,scene('prismatic-garden','Prismatic garden','portfolio','/assets/shaders/prismatic-garden.glsl','/public/scenes/prismatic-garden.webp')
    ,scene('idea-constellation','Idea constellation','team','/assets/shaders/idea-constellation.glsl','/public/scenes/idea-constellation.webp')
    ,scene('resonance-rings','Resonance rings','contact','/assets/shaders/resonance-rings.glsl','/public/scenes/resonance-rings.webp')
  ];
  for(const [id,name] of [['living-lightning','Living Lightning'],['luminous-roots','Luminous Roots'],['fractal-coral','Fractal Coral'],['ribbon-vortex','Ribbon Vortex'],['crystal-mycelium','Crystal Mycelium'],['recursive-bloom','Recursive Bloom'],['molten-glass','Molten Glass'],['neon-mandelbulb','Neon Mandelbulb'],['aurora-weave','Aurora Weave'],['fractal-cathedral','Fractal Cathedral']]) entries.push(scene(id,name,'opensource',`/assets/shaders/fractals/${id}.glsl`,`/public/scenes/fractals/${id}.webp`,id==='neon-mandelbulb'?[400000,260000,180000]:[640000,400000,260000]));
  window.ShaderLibrary=Object.freeze({version,categories:Object.freeze(categories),entries:Object.freeze(entries),forCategory:id=>entries.filter(s=>s.category===id)});
})();
