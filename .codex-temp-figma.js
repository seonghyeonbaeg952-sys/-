// temporary syntax probe
const item = { open: true, a: 1 };
function navAction(dest,duration){return {type:"NODE",navigation:"CHANGE_TO",destinationId:dest.id,transition:{type:"SMART_ANIMATE",duration:duration,easing:{type:"CUSTOM_CUBIC_BEZIER",easingFunctionCubicBezier:{x1:.22,y1:1,x2:.36,y2:1}},resetScrollPosition:false,resetVideoPosition:false}}
const variants = [{id:"a"},{id:"b"},{id:"c"},{id:"d"}];
const x = navAction(variants[item.a*2+(item.open?0:1)],item.open ? .42 : .52);
