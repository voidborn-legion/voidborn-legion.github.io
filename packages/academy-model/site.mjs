export const sitePath = 'data/site.json';
export const defaultSite = {
  schemaVersion: 1,
  brand: 'VOIDBORN',
  navigation: [{text:'Entdecken',link:'/'},{text:'Guides',link:'/guides/'},{text:'Klassen',link:'/guides/klassen.html'},{text:'Tools',link:'/guides/tools.html'}],
  home: {
    title:'Was steht', emphasis:'bei dir an?', intro:'AION-2-Guides zu deinen Fragen im Spiel. Aus der Academy unserer Voidborn-Gilde.',
    image:'/images/voidborn-rift.png', imageAlt:'', actionText:'Guide suchen', topicsTitle:'Welches Thema suchst du?',
    searchPlaceholder:'Zum Beispiel: Arkana, Seelenbindung oder Leveln …',
    workNote:'Die Beiträge sind importiert und werden für die Website aufbereitet. Viele Themen-Seiten enthalten deshalb noch eine Übersicht statt des fertigen Guides.',
    featureTitle:'Ein neues Teil. Was behältst du?', featureText:'Verstärkung und Seelenbindung vor dem Wechsel vergleichen.',
    featureLink:'/guides/ausruestung.html', featureLabel:'Ausrüstung & Seelenbindung', featureNote:'Die vollständige Anleitung wird vorbereitet.',
    bottomTitle:'Vor dem nächsten Run', bottomText:'Aufladungen prüfen, Wochenziele planen oder einen Engpass nachschlagen.',
    bottomLinks:[{text:'Daily & Weekly',link:'/guides/checklisten.html'},{text:'Kinah & Materialien',link:'/guides/tipps.html'}]
  },
  footer:{message:'Ein unabhängiges Fanprojekt der Voidborn-Legion. Nicht mit NCSOFT verbunden.',copyright:'AION 2 und zugehörige Marken gehören ihren jeweiligen Rechteinhabern.'}
};
export function safeLink(value) {
  return typeof value==='string' && value.length<=2000 && !/[\s\\\u0000-\u001f]/.test(value) && !value.startsWith('//') && (/^\/(?!\/)/.test(value) || /^https:\/\/[^/]+/.test(value));
}
export function validateSite(value) {
  const fail=()=>{throw new Error('Ungültige Seiteneinstellungen. Texte, Bildpfad und HTTPS-/interne Links prüfen.');};
  if(!value||value.schemaVersion!==1||typeof value.brand!=='string'||!value.brand.trim()||value.brand.length>60)fail();
  const links=(items,max)=>{if(!Array.isArray(items)||items.length>max)fail();for(const i of items)if(!i||typeof i.text!=='string'||!i.text.trim()||i.text.length>100||!safeLink(i.link)||Object.keys(i).some(k=>!['text','link'].includes(k)))fail();};
  links(value.navigation,8);if(!value.navigation.length)fail();links(value.home?.bottomLinks,4);
  for(const key of Object.keys(defaultSite.home).filter(k=>k!=='bottomLinks'))if(typeof value.home?.[key]!=='string'||value.home[key].length>2000)fail();
  if(!/^\/images\/[a-zA-Z0-9/_ .-]+\.(png|jpg|jpeg|webp)$/.test(value.home.image)||value.home.image.includes('..')||!safeLink(value.home.featureLink))fail();
  for(const key of ['message','copyright'])if(typeof value.footer?.[key]!=='string'||value.footer[key].length>1000)fail();
  if(Object.keys(value).some(k=>!['schemaVersion','brand','navigation','home','footer'].includes(k))||Object.keys(value.home).some(k=>!Object.hasOwn(defaultSite.home,k))||Object.keys(value.footer).some(k=>!Object.hasOwn(defaultSite.footer,k)))fail();
  return structuredClone(value);
}
