import { installDesign } from './design/system';
import { keyCap } from '../input/caps';
import { PHONE_QUERY } from './design/tokens';
import { installPageKeys, moreBelow, readingZone, topModal } from '../input/zone';
import { tx } from '../narrative/text';

/** The play mode's interface style, built from the design system (journal Passes UI3 / UM1, direction A « Voile »): the tone's colours (`--ds-*`,
 *  src/ui/design/tokens.ts), sheets of ink without a frame, one-pixel rules between the rows, square corners, keys in outline, no drop shadow;
 *  the embedded title font for titles, names and numbers and the embedded text font for sentences, no text under 16 px on a computer or 14 px on
 *  a phone. DOM over the canvas, keyboard reachable. On a phone (L3) a modal sheet stands at the bottom of the screen. Every page shares one foot (the page's
 *  action with Enter, the way out with Esc), what scrolls fades out at its edges, and a page that chooses is a list with the detail of the line selected: the
 *  gear's page (journal Passe UM9), the skills, the tournament and the journal (journal Passe UM11). */

const CSS = `
.pm{position:fixed;z-index:30;color:var(--ds-ivory);font:400 var(--ds-fs-body)/1.35 var(--ds-text);font-variant-numeric:tabular-nums}
.pm,.pm *{box-sizing:border-box;scrollbar-color:var(--ds-muted) transparent;scrollbar-width:thin}
.pm-h{margin:0 0 8px;font:400 var(--ds-fs-title)/1.1 var(--ds-title);color:var(--ds-ivory)}
.pm-sub{font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-num{font:400 var(--ds-fs-label)/1 var(--ds-title);color:var(--ds-ivory)}
.pm-btn{display:flex;align-items:baseline;gap:12px;width:100%;margin:0;padding:9px 0;text-align:left;font:inherit;font-size:var(--ds-fs-label);line-height:1.25;color:var(--ds-ivory);background:none;border:0;border-top:1px solid var(--ds-line);border-radius:0;outline:0;cursor:pointer}
.pm-btn:hover:not(:disabled),.pm-btn:focus{color:var(--ds-accent)}
.pm-btn:disabled{cursor:default;color:var(--ds-muted)}
.pm-btn .why{display:block;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-btn .cost{margin-left:auto;flex:none;font-size:var(--ds-fs-body);white-space:nowrap;color:var(--ds-muted)}
.pm-btn .cost+.cost{margin-left:0}
.pm-btn:hover:not(:disabled) .cost,.pm-btn:focus .cost,.pm-btn.primary .cost{color:var(--ds-accent)}
.pm-btn.primary{color:var(--ds-accent)}
.pm-btn:hover:not(:disabled) kbd,.pm-btn:focus kbd,.pm-btn.primary kbd{border-color:var(--ds-accent)}
.pm input:focus-visible{outline:1px solid var(--ds-accent);outline-offset:1px}
.pm-line{margin:8px 0 0;font-size:var(--ds-fs-line);line-height:1.35}
.pm-line q{display:block;margin:0 0 6px;quotes:none}
.pm-overlay{position:fixed;inset:0;z-index:40;display:grid;place-items:center;background:var(--ds-veil);padding:16px}
.pm-overlay .pm-card{display:flex;flex-direction:column;width:min(680px,100%);max-height:calc(100vh - 32px);overflow:hidden;padding:6px 4px 0}
.pm-body{flex:0 1 auto}
.pm-overlay .pm-card p{margin:6px 0}
.pm-overlay.pm-band{inset:auto 0 0 0;display:block;padding:72px var(--ds-gutter) 40px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 72px),transparent 100%)}
.pm-band .pm-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,300px);gap:28px;width:auto;max-width:1620px;margin:0 auto;overflow:visible;padding:0}
.pm-band .pm-foot{align-self:start;padding-top:0}
.pm-big{font:400 var(--ds-fs-title-big)/1.2 var(--ds-title);color:var(--ds-ivory);text-align:center;margin:6px 0 4px}
.pm-check{flex:none;align-self:center;width:12px;height:12px;border:1px solid var(--ds-muted)}
.pm-btn[aria-pressed=true] .pm-check{background:currentColor;border-color:currentColor}
.pm-table{width:100%;border-collapse:collapse}
.pm-table td{padding:6px 4px;border-top:1px solid var(--ds-line)}
.pm-table td:first-child{width:2.6em}
.pm-table tr.me{color:var(--ds-accent)}
.pm-table tr.me .pm-num{color:var(--ds-accent)}
.pm-table td.pts{text-align:right;white-space:nowrap}
.pm-gap{margin-top:12px!important}
.pm-center{text-align:center}
.pm-toggle{cursor:pointer}
.pm-overlay .pm-card.pm-two{display:grid;grid-template-columns:minmax(0,520px) minmax(0,1fr);column-gap:72px;width:min(1280px,100%);height:min(880px,calc(100vh - 64px));max-height:none;overflow:hidden;padding:6px 0 0;--hs:4}
.pm-col{display:flex;flex-direction:column;min-height:0;min-width:0}
.pm-col>.pm-grow{flex:1 1 auto;min-height:0}
.pm-overlay .pm-card.pm-two.pm-days{grid-template-columns:minmax(0,340px) minmax(0,1fr)}
.pm-self{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);column-gap:24px;align-content:start;min-height:0}
.pm-fig{grid-row:1;position:relative}
.pm-hero{display:block;transform:scaleX(-1);width:calc(var(--fw)*var(--hs)*1px);height:calc(var(--fh)*var(--hs)*1px);background-repeat:no-repeat;background-size:calc(var(--fn)*100%) 100%;image-rendering:pixelated;animation:pm-hero var(--fd) steps(var(--fn),end) infinite}
@keyframes pm-hero{to{background-position-x:calc(var(--fw)*var(--fn)*var(--hs)*-1px)}}
.pm-fig .pm-h{margin:6px 0 0;text-align:center;padding-top:6px;border-top:1px solid var(--ds-line)}
.pm-worn{grid-row:1;min-width:0;align-self:start}
.pm-worn .row{padding:8px 0 10px;border-top:1px solid var(--ds-line);min-width:0}
.pm-worn .row:first-child{border-top:0;padding-top:0}
.pm-worn .row small{display:block;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-worn .row b{display:block;font:400 var(--ds-fs-label)/1.2 var(--ds-title)}
.pm-worn .row span{display:block;font-size:var(--ds-fs-small);line-height:1.25;color:var(--ds-muted)}
.pm-worn .row.empty b{color:var(--ds-muted)}
.pm-worn .row.hit small,.pm-worn .row.hit b{color:var(--ds-accent)}
.pm-stats{grid-column:1 / 3;grid-row:2;margin:18px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:32px;align-content:start}
.pm-stats .ttl{grid-column:1 / 3;margin:0 0 4px;font:400 var(--ds-fs-label)/1.2 var(--ds-title)}
.pm-stats div{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-top:1px solid var(--ds-line);font-size:var(--ds-fs-small)}
.pm-stats dt{color:var(--ds-muted)}
.pm-stats dd{margin:0;white-space:nowrap}
.pm-vs{width:100%;border-collapse:collapse;margin:12px 0 6px;font-size:var(--ds-fs-small);font-variant-numeric:tabular-nums}
.pm-vs th{font-weight:400;color:var(--ds-muted);text-align:right;padding:2px 0 4px 12px;white-space:nowrap}
.pm-vs td{text-align:right;padding:4px 0 4px 12px;border-top:1px solid var(--ds-line);white-space:nowrap}
.pm-vs td:first-child,.pm-vs th:first-child{text-align:left;padding-left:0;color:var(--ds-muted);white-space:normal}
.pm-goods{display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;min-height:0;min-width:0}
.pm-ghead{display:flex;align-items:center;gap:16px;padding-bottom:12px}
.pm-ghead img{display:block;width:64px;height:64px;image-rendering:pixelated}
.pm-ghead .pm-h{margin:0}
.pm-ghead .pm-h small{display:block;margin-top:4px;font:400 var(--ds-fs-small)/1.2 var(--ds-text);color:var(--ds-muted)}
.pm-purse{margin-left:auto;text-align:right;white-space:nowrap}
.pm-purse b{display:block;font:400 var(--ds-fs-fig)/1 var(--ds-title)}
.pm-purse small{font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-glist{overflow:auto;min-height:0;border-bottom:1px solid var(--ds-line)}
.pm-glist .pm-sub{margin:12px 0 4px}
.pm-glist .pm-sub:first-child{margin-top:0}
.pm-glist .pm-btn{padding:7px 0}
.pm-where{margin:0;max-width:640px;font-size:var(--ds-fs-body);line-height:1.35}
.pm-btn[aria-disabled=true]{color:var(--ds-muted);cursor:default}
.pm-btn[aria-disabled=true]:hover,.pm-btn[aria-disabled=true]:focus{color:var(--ds-muted)}
.pm-btn[aria-disabled=true]:hover .cost,.pm-btn[aria-disabled=true]:focus .cost{color:var(--ds-muted)}
.pm-btn.on{box-shadow:inset 3px 0 0 var(--ds-accent);padding-left:12px}
.pm-goods .pm-detail{min-height:236px;padding:14px 0 0}
/* the skills page (the operator's CM-02 « A · Quatre places et un catalogue » in the look of the sheet's mock-up, journal Passe CM2): the four places in a row of cards, the catalogue of tiles under them */
.pm-overlay .pm-card.pm-two.pm-skills.pm-solo{grid-template-columns:minmax(0,1fr);width:min(1040px,100%)}
/* IA-05 (the operator's « Deux rangées au moins, le détail se replie », journal Passe IA2): the catalogue's row is never under two rows of tiles, whatever the window; on a short one the detail folds to its first lines (the rest by Page ↓, the line says so) and the places tighten */
.pm-skills{--sk-tile:84px;--sk-two:calc(var(--sk-tile)*2 + 14px)}
.pm-skills .pm-goods{grid-template-rows:auto auto auto auto auto minmax(var(--sk-two),1fr) auto auto}
.pm-skills .pm-goods .pm-detail{min-height:0;max-height:min(23vh,220px);padding-top:10px}
.sk-lab{margin:0;font-size:var(--ds-fs-small);letter-spacing:.1em;text-transform:uppercase;color:var(--ds-muted)}
.sk-modebox{margin-left:auto;display:flex;align-items:center;gap:10px;flex:none}
.sk-mode{display:inline-flex;flex:none;border:1px solid var(--ds-line);background:none;color:var(--ds-muted);font:inherit;cursor:pointer;padding:0}
.sk-mode span{padding:4px 14px;font-size:var(--ds-fs-small)}
.sk-mode span.on{background:var(--ds-ivory);color:var(--ds-ink)}
.sk-mode:focus,.sk-mode.on{outline:0;box-shadow:inset 0 0 0 1px var(--ds-accent)}
.sk-places-lab{padding:2px 0 8px}
.sk-places{display:grid;grid-template-columns:repeat(auto-fit,minmax(178px,1fr));gap:10px}
.sk-slot{position:relative;display:flex;flex-direction:column;gap:8px;min-width:0;border:1px solid var(--ds-line);padding:10px 12px 9px}
.sk-slot:has(.sk-main.on),.sk-slot.armed{border-color:var(--ds-accent)}
.sk-slot.free{border-style:dashed}
.sk-slot .sk-main{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:0;text-align:left;width:100%;border-top:0}
.sk-slot .sk-main.on,.sk-tile.on{box-shadow:none;padding-left:0}
.sk-slot .sk-main .n{position:absolute;top:2px;right:11px;font:400 var(--ds-fs-small)/1 var(--ds-title);color:var(--ds-muted)}
.sk-slot .sk-main b{padding-right:40px}
.sk-slot .sk-main .n kbd{min-width:22px;height:22px;padding:0 6px;font-size:var(--ds-fs-small);line-height:20px;box-sizing:border-box;vertical-align:top}
.sk-slot .sk-main b{font:400 var(--ds-fs-label)/1.2 var(--ds-title);color:var(--ds-ivory)}
.sk-slot .sk-main small,.sk-tile small{display:block;font-size:var(--ds-fs-small);line-height:1.3;color:var(--ds-muted)}
.sk-slot .cd{margin:0;font-size:var(--ds-fs-small);line-height:1.3;color:var(--ds-ivory)}
.sk-slot .cd.chip{font:inherit;font-size:var(--ds-fs-small);text-align:left;color:var(--ds-ivory);background:none;border:1px solid var(--ds-line);padding:3px 8px;cursor:pointer}
.sk-slot .cd.chip:hover{border-color:var(--ds-ivory)}
.sk-slot .cd.chip::after{content:"";display:inline-block;margin-left:8px;vertical-align:2px;border:4px solid transparent;border-top-color:currentColor;border-bottom:0}
.sk-ctl{display:flex;flex-wrap:wrap;gap:6px}
.sk-ctl button{font:inherit;font-size:var(--ds-fs-small);color:var(--ds-muted);background:none;border:1px solid var(--ds-line);padding:2px 9px;cursor:pointer}
.sk-ctl button:hover{color:var(--ds-ivory);border-color:var(--ds-ivory)}
.sk-ctl button:disabled{opacity:.35;cursor:default}
.sk-conds{grid-column:1 / -1;display:flex;flex-direction:column;padding:6px 0 4px}
.sk-conds .pm-sub{margin:0 0 4px}
.sk-conds .pm-btn{padding:5px 0}
.sk-note{padding:8px 0 2px}
.sk-note p{margin:0 0 2px;font-size:var(--ds-fs-small);line-height:1.3;color:var(--ds-muted)}
.sk-note .sk-say{min-height:1.3em;color:var(--ds-accent)}
.sk-note .sk-say.sk-modeline{color:var(--ds-muted)}
.sk-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:8px 0 6px}
.sk-filters{display:flex;flex-wrap:wrap;gap:6px}
.sk-chipf{width:auto;padding:2px 12px;border:1px solid var(--ds-line);border-radius:12px;font-size:var(--ds-fs-small)}
.sk-chipf[aria-pressed=true]{border-color:var(--ds-accent);color:var(--ds-ivory)}
.sk-chipf.on{box-shadow:none;padding-left:12px;border-color:var(--ds-ivory)}
.pm-glist.sk-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:8px;align-content:start;border-bottom:0;padding-bottom:6px}
.sk-tile{display:flex;flex-direction:column;align-items:flex-start;gap:1px;width:auto;padding:7px 10px;border:1px solid var(--ds-line);text-align:left}
.sk-tile.on{border-color:var(--ds-accent)}
.sk-tile[aria-pressed=true]{border-color:var(--ds-muted)}
.sk-tile[aria-pressed=true].on{border-color:var(--ds-accent)}
.sk-tile b{font-weight:600}
.sk-tile .st{font-size:var(--ds-fs-small);line-height:1.25;color:var(--ds-accent)}
.sk-tile.warn{opacity:.65}.sk-tile.warn .st{color:var(--ds-muted)}
/* the gear page (journal Passes EP1 to EP3): the hero and his four places on the left, a catalogue of tiles on the right, in the skills page's drawing */
.pm-gear .pm-goods{grid-template-rows:auto auto minmax(0,1fr) auto auto}
.pm-gear .pm-goods .pm-detail{min-height:0;max-height:min(30vh,250px);padding-top:10px}
.sk-lab.say{color:var(--ds-accent)}
.gp-casebox{grid-column:2;grid-row:1;min-width:0;align-self:start;display:flex;flex-direction:column;gap:6px}
.gp-lab{padding:2px 0}
.gp-cases{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
.gp-case{gap:3px;padding:6px 10px 6px}
.gp-case .sk-main{gap:1px}
.gp-case .sk-ctl button{padding:1px 8px}
.pm-gear .pm-stats{margin-top:10px}
.pm-gear .pm-stats div{padding:3px 0}
.gp-case .sk-main .gp-k{display:flex;gap:8px;align-items:baseline;width:100%;font-size:var(--ds-fs-small);letter-spacing:.1em;text-transform:uppercase;color:var(--ds-muted)}
.gp-case .sk-main .gp-k i{margin-left:auto;font-style:normal;letter-spacing:0;text-transform:none}
.gp-case.hit,.gp-case:has(.sk-main.on),.gp-case.armed{border-color:var(--ds-accent)}
.gp-case.armed{outline:1px solid var(--ds-accent)}
.gp-case.hand .sk-main b{color:var(--ds-muted)}
.gp-case.free .sk-main small.hint{color:var(--ds-accent)}
.sk-ctl button.sell{color:var(--ds-accent)}
.gp-panels{display:inline-flex;margin-right:18px;border:1px solid var(--ds-line)}
.gp-panels+.pm-purse{margin-left:0}
.gp-seg{font:inherit;font-size:var(--ds-fs-small);padding:4px 16px;border:0;background:none;color:var(--ds-muted);cursor:pointer}
.gp-seg[aria-pressed=true]{background:var(--ds-ivory);color:var(--ds-ink)}
.gp-seg:focus{outline:0;box-shadow:inset 0 0 0 1px var(--ds-accent)}
.pm-glist.sk-tiles.gp-tiles{grid-template-columns:repeat(auto-fill,minmax(164px,1fr))}
.gp-tiles .gp-sub,.gp-tiles .gp-empty{grid-column:1 / -1;margin:6px 0 -2px}
.gp-tiles .pm-where{grid-column:1 / -1}
.gp-tiles .sk-tile .st{display:flex;justify-content:space-between;align-items:baseline;gap:8px;width:100%}
.gp-tiles .sk-tile .st em{font-style:normal;color:var(--ds-ivory)}
.gp-tiles .sk-tile.warn{opacity:.8}
.gp-tiles .sk-tile .st .cost{margin-left:0}
.gp-confirm .nm{color:var(--ds-accent)}
@media (max-height:900px){.pm-overlay .pm-card.pm-two.pm-gear{grid-template-columns:minmax(0,480px) minmax(0,1fr)}.pm-gear .gp-lab{display:none}.pm-gear .pm-ghead img{width:48px;height:48px}}
@media (max-width:1000px){.pm-gear .gp-casebox{grid-column:1}}
@media (max-height:760px){.sk-legend{display:none}.pm-skills .pm-goods .pm-detail{max-height:18vh}.sk-slot{padding:7px 10px 6px;gap:5px}}
@media (min-width:701px){.pm-skills:not(.pm-solo) .sk-places{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.pm-skills:not(.pm-solo) .sk-slot .cd.chip .pre{display:none}}
@media (max-height:800px){.pm-skills .pm-goods .pm-detail{max-height:min(14vh,104px);--fade:22px;scroll-padding-block:22px}.pm-skills:not(.pm-solo) .sk-tile small .fam{display:none}.pm-skills .sk-note{padding:4px 0 0}.pm-skills .sk-bar{padding:4px 0}.pm-skills .sk-places-lab{padding:0 0 4px}.pm-skills .pm-ghead{padding-bottom:6px}.pm-skills:not(.pm-solo) .sk-slot .sk-main small{display:none}}
.pm-detail .nm{margin:0;font:400 var(--ds-fs-label)/1.2 var(--ds-title)}
.pm-detail .what{margin:2px 0 0;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-detail .ab{margin:6px 0 0;font-size:var(--ds-fs-body);line-height:1.3}
.pm-detail .no{margin:10px 0 0;font-size:var(--ds-fs-body);color:var(--ds-accent)}
.pm-detail .news{margin:0 0 8px;font-size:var(--ds-fs-body);color:var(--ds-accent)}
.pm-cmp{display:grid;grid-template-columns:minmax(0,1fr) 92px 92px max-content;margin:10px 0 0;font-size:var(--ds-fs-body)}
.pm-cmp>*{padding:3px 0;border-top:1px solid var(--ds-line);text-align:right;white-space:nowrap}
.pm-cmp .l{text-align:left;color:var(--ds-muted)}
.pm-cmp .h{border-top:0;padding-top:0;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-cmp .v{color:var(--ds-muted)}
.pm-cmp .a{color:var(--ds-ivory)}
.pm-cmp .a.up{color:var(--ds-accent)}
.pm-cmp .m{padding-left:12px;font-size:var(--ds-fs-small);line-height:1.5;color:var(--ds-muted)}
.pm-cmp .m.up{color:var(--ds-accent)}
.pm-two.still .pm-btn::before{animation:none}
@media (max-height:900px){.pm-overlay .pm-card.pm-two{--hs:3;column-gap:56px;grid-template-columns:minmax(0,440px) minmax(0,1fr)}.pm-goods .pm-detail{min-height:216px}}
@media (max-height:640px){.pm-overlay .pm-card.pm-two{--hs:2}.pm-stats{margin-top:10px}.pm-worn .row{padding:5px 0 6px}.pm-worn .row span{display:none}.pm-goods .pm-detail{min-height:196px}.pm-ghead img{width:48px;height:48px}}
@media (max-width:1000px){.pm-overlay .pm-card.pm-two{column-gap:32px;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)}.pm-self{grid-template-columns:minmax(0,1fr)}.pm-fig{display:none}.pm-stats{grid-column:1}.pm-stats div{font-size:var(--ds-fs-small)}.pm-cmp{grid-template-columns:minmax(0,1fr) 72px 72px max-content}}
@media (max-width:700px){
  .pm-overlay .pm-card.pm-two{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);height:calc(100vh - 26px);row-gap:10px}
  .pm-self{display:block}
  .pm-fig,.pm-stats{display:none}
  .pm-worn{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:14px}
  .pm-worn .row,.pm-worn .row:first-child{padding:4px 0;border-top:1px solid var(--ds-line)}
  .pm-worn .row span{display:none}
  .pm-glist .pm-btn .why{display:block}
  .pm-col .pm-glist{flex:0 1 auto;max-height:36vh}
  .pm-overlay .pm-card.pm-two.pm-days{grid-template-columns:minmax(0,1fr)}
  .pm-ghead{padding-bottom:6px}
  .pm-ghead img{width:48px;height:48px}
  .pm-goods .pm-detail{min-height:0;padding-top:8px}
  .pm-cmp{grid-template-columns:minmax(0,1fr) 64px 64px max-content}
}
@media (max-height:480px) and (min-width:701px){
  .pm-overlay .pm-card.pm-two{display:block;height:calc(100vh - 26px)}
  .pm-self{display:none}
  .pm-goods{height:100%;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);grid-template-rows:auto minmax(0,1fr) auto;column-gap:24px}
  .pm-ghead{grid-column:1 / 3;padding-bottom:4px}
  .pm-ghead img{width:48px;height:48px}
  .pm-glist{grid-column:1;grid-row:2}
  .pm-goods .pm-detail{grid-column:2;grid-row:2;min-height:0;padding-top:0}
  .pm-goods .pm-foot{grid-column:1 / 3;grid-row:3;padding-top:4px}
  .pm-cmp{grid-template-columns:minmax(0,1fr) 64px 64px max-content;margin-top:4px}
}
/* a phone both narrow and short (568 x 320: the width rule stacked the hero's column over the list, leaving the list and the detail no height and the foot's second line
   under the card, journal Passe PF1): the skills' and the gear's pages as the short screens above, the list and the detail side by side, the foot below */
@media (max-height:480px) and (max-width:700px){
  .pm-overlay .pm-card.pm-two.pm-skills,.pm-overlay .pm-card.pm-two.pm-wares{display:block;height:calc(100vh - 26px)}
  .pm-skills .pm-self,.pm-wares .pm-self{display:none}
  .pm-skills .pm-goods,.pm-wares .pm-goods{height:100%;grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr);grid-template-rows:auto minmax(0,1fr) auto;column-gap:18px}
  .pm-skills .pm-ghead,.pm-wares .pm-ghead{grid-column:1 / 3;padding-bottom:4px}
  .pm-skills .pm-glist,.pm-wares .pm-glist{grid-column:1;grid-row:2}
  .pm-skills .pm-detail,.pm-wares .pm-detail{grid-column:2;grid-row:2;min-height:0;padding-top:0}
  .pm-skills .pm-foot,.pm-wares .pm-foot{grid-column:1 / 3;grid-row:3;padding-top:4px;column-gap:18px}
  .pm-skills .pm-goods{display:flex;flex-direction:column;overflow:auto;height:100%}
  .pm-skills .sk-note,.pm-skills .sk-places-lab,.pm-skills .pm-detail,.pm-skills .sk-slot .sk-main small{display:none}
  .pm-skills .sk-places{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pm-skills .pm-glist{max-height:none;overflow:visible}
}
@media (max-height:480px){
  .pm-overlay .pm-card.pm-two.pm-gear{display:flex;flex-direction:column;height:calc(100vh - 26px)}
  .pm-gear .pm-self{display:block;flex:none;padding-bottom:6px}
  .pm-gear .pm-fig,.pm-gear .pm-stats,.pm-gear .gp-lab,.pm-gear .sk-note,.pm-gear .sk-bar,.pm-gear .gp-case small,.pm-gear .sk-ctl{display:none}
  .pm-gear .gp-casebox{grid-column:auto}
  .pm-gear .gp-cases{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
  .pm-gear .gp-case{padding:3px 8px;gap:0}
  .pm-gear .gp-case .sk-main{gap:0}
  .pm-gear .gp-case .sk-main b{font-size:var(--ds-fs-small);line-height:1.15}
  .pm-gear .gp-case:not(.free) .gp-k{display:none}
  .pm-gear .pm-goods{flex:1 1 auto;height:auto;min-height:0;grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr);grid-template-rows:auto minmax(0,1fr) auto;column-gap:18px}
  .pm-gear .pm-ghead{grid-column:1 / 3;padding-bottom:2px}
  .pm-gear .pm-glist{grid-column:1;grid-row:2;max-height:none}
  .pm-gear .pm-detail{grid-column:2;grid-row:2;max-height:none;padding-top:0}
  .pm-gear .pm-foot{grid-column:1 / 3;grid-row:3;padding-top:4px;column-gap:18px}
  .pm-gear .pm-glist.sk-tiles{grid-template-columns:minmax(0,1fr);gap:4px}
  .pm-gear .sk-tile{flex-direction:row;flex-wrap:wrap;column-gap:8px;align-items:baseline;padding:4px 8px}
  .pm-gear .sk-tile small{display:none}
  .pm-gear .gp-tiles .sk-tile .st{width:auto;margin-left:auto}
}
@media (max-height:480px) and (min-width:701px){
  .pm-notebook .pm-card.pm-two{display:grid;grid-template-columns:minmax(0,0.8fr) minmax(0,1.2fr);column-gap:24px}
  .pm-notebook .pm-head p{display:none}
  .pm-notebook .pm-who img{width:48px;height:48px}
}
@media (max-width:700px){
  .pm-notebook .pm-head p{display:none}
  .pm-notebook .pm-col .pm-glist{max-height:22vh}
  .pm-notebook .pm-who img{display:none}
  .pm-notebook .pm-who{padding-bottom:4px}
}
.pm-col .pm-glist{border-bottom:0}
.pm-col .pm-head{padding-bottom:12px}
.pm-col .pm-head .pm-h{margin:0}
.pm-col .pm-head p{margin:4px 0 0;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-col .pm-head p.nx{font-size:var(--ds-fs-body);color:var(--ds-ivory)}
.pm-col .pm-detail{padding:0}
.pm-col .pm-detail .pm-sub{margin:16px 0 4px}
.pm-col .pm-detail .pm-sub:first-child{margin-top:0}
.pm-col .pm-detail p{margin:6px 0}
.pm-who{display:flex;gap:16px;align-items:center;padding-bottom:10px}
.pm-who img{display:block;width:64px;height:64px;image-rendering:pixelated}
.pm-who .pm-h{margin:0}
.pm-who .pm-h small{display:block;margin-top:4px;font:400 var(--ds-fs-small)/1.2 var(--ds-text);color:var(--ds-muted)}
.pm-rec{margin-left:auto;text-align:right;white-space:nowrap}
.pm-rec b{display:block;font:400 var(--ds-fs-fig)/1 var(--ds-title)}
.pm-rec small{font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-bout{display:flex;justify-content:space-between;gap:16px;padding:6px 0;border-top:1px solid var(--ds-line)}
.pm-bout b{font-weight:400}
.pm-bout small{display:block;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-bout .d{flex:none;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-bout.next b{color:var(--ds-muted)}
.pm-btn .rk{flex:none;width:1.6em;color:var(--ds-muted)}
.pm-btn .me{margin-left:8px;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-entry{margin:6px 0}
.pm-entry .why{display:block;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-card label{display:block;font-size:var(--ds-fs-label)}
.pm-card label b{float:right;font-weight:400;color:var(--ds-muted)}
.pm-card input[type=range]{-webkit-appearance:none;appearance:none;display:block;width:100%;height:24px;margin:2px 0 0;background:none;cursor:pointer;--v:0%}
.pm-card input[type=range]::-webkit-slider-runnable-track{height:1px;background:linear-gradient(to right,var(--ds-accent) var(--v),var(--ds-line) var(--v))}
.pm-card input[type=range]::-moz-range-track{height:1px;background:linear-gradient(to right,var(--ds-accent) var(--v),var(--ds-line) var(--v))}
.pm-card input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:8px;height:18px;margin-top:-9px;background:var(--ds-accent);border:0;border-radius:0}
.pm-card input[type=range]::-moz-range-thumb{width:8px;height:18px;background:var(--ds-accent);border:0;border-radius:0}
@media ${PHONE_QUERY}{.pm-overlay{place-items:end center;padding:12px 18px 14px}.pm-overlay .pm-card{width:100%;max-height:calc(100vh - 26px)}.pm-overlay.pm-band{padding:48px 18px 14px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 48px),transparent 100%)}.pm-band .pm-card{grid-template-columns:minmax(0,1fr);gap:10px}}
.pm-overlay{animation:ds-fade .16s ease-out}
.pm-overlay .pm-card{animation:ds-in .16s ease-out}
.pm-overlay.pm-band,.pm-talk{animation:ds-rise .2s ease-out}
.pm-overlay.pm-band .pm-card{animation:none}
.pm-scroll{overflow:auto;min-height:0;scroll-padding-block:44px}
#pm-more{z-index:45;display:none;justify-content:flex-end;pointer-events:none}
#pm-more.on{display:flex}
#pm-more span{padding:2px 10px;font-size:var(--ds-fs-small);color:var(--ds-ivory);background:color-mix(in srgb,var(--ds-ink) 90%,transparent);border:1px solid var(--ds-line)}
body.pm-pad #pm-more .k,body:not(.pm-pad) #pm-more .p{display:none}
.pm-scroll[data-more=b]{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - var(--fade,44px)),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - var(--fade,44px)),transparent)}
.pm-scroll[data-more=t]{-webkit-mask-image:linear-gradient(to top,#000 calc(100% - var(--fade,44px)),transparent);mask-image:linear-gradient(to top,#000 calc(100% - var(--fade,44px)),transparent)}
.pm-scroll[data-more=tb]{-webkit-mask-image:linear-gradient(to bottom,transparent,#000 var(--fade,44px),#000 calc(100% - var(--fade,44px)),transparent);mask-image:linear-gradient(to bottom,transparent,#000 var(--fade,44px),#000 calc(100% - var(--fade,44px)),transparent)}
.pm-foot{flex:none;display:flex;flex-wrap:wrap;align-items:center;gap:6px 28px;padding-top:12px}
.pm-foot .pm-btn{width:auto;gap:10px;padding:4px 0;border-top:0;white-space:nowrap}
.pm-foot .pm-btn::before{display:none}
.pm-foot .out{margin-left:auto}
.pm-btn{position:relative}
.pm-btn::before{content:'';position:absolute;left:0;right:0;top:-1px;height:1px;background:var(--ds-line);transform-origin:left center;animation:ds-rule .24s ease-out backwards}
.pm-btn{border-top-color:transparent}
.pm-btn:nth-of-type(2)::before{animation-delay:.03s}.pm-btn:nth-of-type(3)::before{animation-delay:.06s}.pm-btn:nth-of-type(4)::before{animation-delay:.09s}.pm-btn:nth-of-type(n+5)::before{animation-delay:.12s}
html.cdt-reduced .pm,html.cdt-reduced .pm *,html.cdt-reduced .pm *::before,html.cdt-reduced .pm *::after{transition-property:opacity,color,border-color,background-color!important}
html.cdt-reduced .pm-hero{animation:none}
`;

export function injectStyle(): void {
  installDesign();
  if (document.getElementById('pm-css')) return;
  const st = document.createElement('style');
  st.id = 'pm-css'; st.textContent = CSS;
  document.head.appendChild(st);
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** the up and down arrows walk a list of options (the buttons that can be pressed), around its ends; the keyboard's Tab keeps working */
export function arrowKeys(list: HTMLElement): void {
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const all = [...list.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    if (!all.length) return;
    e.preventDefault(); e.stopPropagation();
    const i = all.indexOf(document.activeElement as HTMLButtonElement), down = e.key === 'ArrowDown';
    all[i < 0 ? (down ? 0 : all.length - 1) : (i + (down ? 1 : -1) + all.length) % all.length].focus();
  });
}

/** the line « Page ↓ for more » (« Right stick » with a pad) at the foot of the topmost page's reading zone, while there is more below (IA-02): the text a page lets
 *  the player read (its detail, its body), never a list (its arrows walk it and the focus keeps its line in view) */
let hintEl: HTMLElement | null = null, hintQueued = false, watching = false;
function updateHint(): void {
  const root = topModal(), zone = root ? readingZone<HTMLElement>(root) : null;
  if (!zone || !zone.matches('.pm-detail, .pm-body') || !moreBelow(zone)) { hintEl?.classList.remove('on'); return; }
  if (!hintEl) { hintEl = el('div', 'pm'); hintEl.id = 'pm-more'; hintEl.setAttribute('aria-hidden', 'true'); document.body.appendChild(hintEl); }
  const html = `<span class="k">${esc(tx('ui.more.key'))}</span><span class="p">${esc(tx('ui.more.pad'))}</span>`;
  if (hintEl.innerHTML !== html) hintEl.innerHTML = html;
  const r = zone.getBoundingClientRect();
  hintEl.style.left = `${r.left}px`; hintEl.style.width = `${r.width}px`; hintEl.style.top = `${r.bottom - 34}px`;
  // a page rises into place in 0.2 s (`ds-rise`): placed again once it has settled
  if (!hintEl.classList.contains('on')) setTimeout(queueHint, 280);
  hintEl.classList.add('on');
}
function queueHint(): void {
  if (hintQueued || typeof requestAnimationFrame === 'undefined') return;
  hintQueued = true;
  requestAnimationFrame(() => { hintQueued = false; updateHint(); });
}
/** a page opening or closing changes which zone is the topmost's: the body's children are watched, the line follows */
function watchPages(): void {
  if (watching || typeof MutationObserver === 'undefined') return;
  watching = true;
  new MutationObserver(queueHint).observe(document.body, { childList: true });
  window.addEventListener('resize', queueHint);
}

/** a list or a text taller than its box (journal Passe UM11): what goes on beyond the edge fades out, above and below, so that a line is never read as cut
 *  in two and one sees that there is more; the keyboard keeps the selected line clear of the fade (`scroll-padding-block`). Returns what a page calls when
 *  it fills the box again. */
export function scrollFade(box: HTMLElement): () => void {
  box.classList.add('pm-scroll');
  // one rule for every zone that scrolls (IA-02, src/input/zone.ts): Page ↓ / Page ↑ / Home / End at the keyboard, and a line that says so while there is more
  installPageKeys(); watchPages();
  const sync = (): void => {
    const v = `${box.scrollTop > 1 ? 't' : ''}${box.scrollHeight - box.clientHeight - box.scrollTop > 1 ? 'b' : ''}`;
    if (v) box.dataset.more = v; else delete box.dataset.more;
    queueHint();
  };
  box.addEventListener('scroll', sync, { passive: true });
  new ResizeObserver(sync).observe(box);
  sync();
  return sync;
}

/** the foot's button: its key, then what it does (journal Passe UM11: one form on every page, Enter for the page's action, Esc for the way out) */
export function footBtn(key: string, label: string, act: () => void, primary = false): HTMLButtonElement {
  // the key's name in the page's language, its English name kept in data-key (the remapping, journal Passe RM2: RM-7)
  const b = el('button', `pm-btn${primary ? ' primary' : ''}`, `${keyCap(key)}<span>${esc(label)}</span>`);
  b.addEventListener('click', act);
  return b;
}

/** a button whose key is Esc is the way out, on the right */
export function fillFoot(f: HTMLElement, ...actions: Array<HTMLElement | null>): void {
  const all = actions.filter((a): a is HTMLElement => !!a);
  f.replaceChildren(...all);
  // a cap names its key in data-key (src/input/caps.ts)
  for (const a of all) { const k = a.querySelector('kbd'); a.classList.toggle('out', (k?.dataset.key ?? k?.textContent) === 'Esc'); }
}

/** the foot of a page or a band: what the page does on the left, the way out on the right, outside what scrolls */
export function footOf(...actions: Array<HTMLElement | null>): HTMLElement {
  const f = el('div', 'pm-foot');
  fillFoot(f, ...actions);
  return f;
}

/** a line of a list with its detail beside it (the gear's page, journal Passe UM9): selected by the keyboard or the mouse, pressed by Enter or a click; a line
 *  out of reach stays selectable */
export function pickRow(html: string, on: { select(b: HTMLButtonElement): void; press(): void; off?: boolean }): HTMLButtonElement {
  const b = el('button', 'pm-btn', html);
  if (on.off) b.setAttribute('aria-disabled', 'true');
  b.addEventListener('focus', () => { b.parentElement?.querySelectorAll('.pm-btn.on').forEach((x) => x.classList.remove('on')); b.classList.add('on'); on.select(b); });
  b.addEventListener('mouseenter', () => b.focus({ preventScroll: true }));
  b.addEventListener('click', () => on.press());
  return b;
}

/** a page on the full-screen veil: the card, what scrolls in it, its foot */
export function pageShell(label: string, cls = ''): { root: HTMLElement; card: HTMLElement; body: HTMLElement; foot: HTMLElement } {
  injectStyle();
  const root = el('div', 'pm pm-overlay'), card = el('div', `pm-card${cls ? ` ${cls}` : ''}`), body = el('div', 'pm-body'), foot = el('div', 'pm-foot');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', label);
  card.append(body, foot); root.appendChild(card);
  scrollFade(body);
  return { root, card, body, foot };
}

/** a modal page over the scene, on a full-screen veil, or `band`: a band at the foot of the screen, the scene kept above it (what is read in
 *  passing, the news); resolves with the id of the button pressed. A primary button is the page's action (Enter), another its way out (Esc). */
export function overlay(html: string, buttons: Array<{ id: string; label: string; primary?: boolean }>, band = false): { root: HTMLElement; done: Promise<string> } {
  injectStyle();
  const root = el('div', `pm pm-overlay${band ? ' pm-band' : ''}`), card = el('div', 'pm-card'), body = el('div', 'pm-body', html), acts = footOf();
  card.setAttribute('role', 'dialog');
  card.append(body, acts); arrowKeys(acts);
  root.appendChild(card);
  const done = new Promise<string>((res) => {
    fillFoot(acts, ...buttons.map((b) => { const x = footBtn(b.primary ? 'Enter' : 'Esc', b.label, () => { root.remove(); res(b.id); }, b.primary); x.dataset.id = b.id; return x; }));
  });
  // the way out answers its key, on a page with no listener of its own too
  root.addEventListener('keydown', (e) => { const out = acts.querySelector<HTMLElement>('.out'); if (e.key === 'Escape' && out) { e.stopPropagation(); out.click(); } });
  document.body.appendChild(root);
  if (!band) scrollFade(body);
  // the sheet opens at its top (a long journal is read from its title), its button focused
  (card.querySelector('.pm-btn.primary') as HTMLButtonElement | null ?? card.querySelector('.pm-btn') as HTMLButtonElement | null)?.focus({ preventScroll: true });
  return { root, done };
}
