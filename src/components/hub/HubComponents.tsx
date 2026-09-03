import React from 'react';
import { ChevronLeft, LucideIcon } from 'lucide-react';

export const PageHeader:React.FC<{title:string;description:string;action?:React.ReactNode;breadcrumb?:string}>=({title,description,action,breadcrumb})=><header className="page-header">
  <div className="min-w-0"><div className="hidden md:block text-xs text-[var(--muted)] mb-1">{breadcrumb || 'سامانه / مرکز خدمات'}</div><h2 className="text-xl font-black text-[var(--text)]">{title}</h2><p className="text-sm text-[var(--muted)] mt-1">{description}</p></div>{action&&<div className="shrink-0">{action}</div>}
</header>;

export const HubSection:React.FC<{title:string;description?:string;children:React.ReactNode}>=({title,description,children})=><section className="space-y-3"><div><h3 className="font-black text-[var(--text)]">{title}</h3>{description&&<p className="text-xs text-[var(--muted)] mt-1">{description}</p>}</div><div className="hub-grid">{children}</div></section>;

export const HubCard:React.FC<{icon:LucideIcon;title:string;description:string;badge?:string;onClick:()=>void;disabled?:boolean}>=({icon:Icon,title,description,badge,onClick,disabled})=><button type="button" disabled={disabled} onClick={onClick} className="hub-card text-right" aria-label={title}>
  <span className="hub-card-icon"><Icon aria-hidden="true"/></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="text-sm text-[var(--text)]">{title}</strong>{badge&&<small className="hub-badge">{badge}</small>}</span><span className="block text-xs text-[var(--muted)] mt-1 leading-5">{description}</span></span><ChevronLeft className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true"/>
</button>;
