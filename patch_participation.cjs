const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/survey-results/ParticipationTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Remove heroChart
content = content.replace(/heroChart=\{\s*<RingGauge[^>]+>\s*\}/, '');

// Replace ActivityRings with the 4 circles
const activityRingsPattern = /\{\/\* One ring per state[\s\S]*?<\/div>/;

const newCircles = `{/* 4 Unified Circle Charts */}
 <div className="flex flex-1 items-center justify-around gap-2 py-2">
   <div className="flex flex-col items-center gap-1.5">
     <div className="relative text-primary">
       <RingGauge value={results.participation.rate} ariaLabel="Tasa de participación" />
       <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-text-primary">
         {formatPercent(results.participation.rate)}
       </span>
     </div>
     <div className="flex flex-col items-center leading-tight">
       <span className="text-[11px] font-semibold text-text-secondary">Participación</span>
       <span className="text-[10px] font-medium text-text-muted">{formatCount(completed + inProgress)}</span>
     </div>
   </div>
   <div className="flex flex-col items-center gap-1.5">
     <div className="relative text-status-positive">
       <RingGauge value={(completed / invited) * 100} ariaLabel="Completadas" />
       <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-text-primary">
         {Math.round((completed / invited) * 100)}%
       </span>
     </div>
     <div className="flex flex-col items-center leading-tight">
       <span className="text-[11px] font-semibold text-text-secondary">Completadas</span>
       <span className="text-[10px] font-medium text-text-muted">{formatCount(completed)}</span>
     </div>
   </div>
   <div className="flex flex-col items-center gap-1.5">
     <div className="relative text-[#EAB308]">
       <RingGauge value={(inProgress / invited) * 100} ariaLabel="En progreso" />
       <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-text-primary">
         {Math.round((inProgress / invited) * 100)}%
       </span>
     </div>
     <div className="flex flex-col items-center leading-tight">
       <span className="text-[11px] font-semibold text-text-secondary">En progreso</span>
       <span className="text-[10px] font-medium text-text-muted">{formatCount(inProgress)}</span>
     </div>
   </div>
   <div className="flex flex-col items-center gap-1.5">
     <div className="relative text-status-negative">
       <RingGauge value={(missing / invited) * 100} ariaLabel="Faltan" />
       <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-text-primary">
         {Math.round((missing / invited) * 100)}%
       </span>
     </div>
     <div className="flex flex-col items-center leading-tight">
       <span className="text-[11px] font-semibold text-text-secondary">Faltan</span>
       <span className="text-[10px] font-medium text-text-muted">{formatCount(missing)}</span>
     </div>
   </div>
 </div>`;

content = content.replace(activityRingsPattern, newCircles);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Patched successfully');
