import {createContentLoader} from 'vitepress'
import catalog from '../../../.academy/studio/catalog.json'
export default createContentLoader('guides/**/*.md',{
 transform(pages){return pages.filter(p=>p.frontmatter.status==='published'&&!p.url.endsWith('/guides/index.html')&&p.url!=='/guides/').map(p=>{
  const path='docs'+p.url.replace(/\.html$/,'.md')
  const entry=catalog.guides.find(g=>g.path===path)
  const category=p.frontmatter.category||catalog.categories.find(c=>c.id===entry?.categoryId)?.slug||null
  return {url:p.url,title:p.frontmatter.title||'Guide',category}
 })}
})
export declare const data: {url:string,title:string,category:string|null}[]
