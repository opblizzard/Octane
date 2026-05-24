import { create } from 'zustand'
export type ToastType='info'|'success'|'warning'|'error'
export interface Toast { id:string; type:ToastType; message:string }
interface ToastStore { toasts:Toast[]; show:(type:ToastType,message:string)=>void; dismiss:(id:string)=>void }
export const useToastStore = create<ToastStore>((set)=>({
  toasts:[],
  show(type,message){
    const id=`toast-${Date.now()}`
    set(s=>({toasts:[...s.toasts,{id,type,message}]}))
    setTimeout(()=>set(s=>({toasts:s.toasts.filter(t=>t.id!==id)})),4000)
  },
  dismiss(id){ set(s=>({toasts:s.toasts.filter(t=>t.id!==id)})) }
}))

// Convenience export for components that do: import { toast } from '@state/toast'
export const toast = {
  show: (type: ToastType, message: string) => useToastStore.getState().show(type, message),
  info: (message: string) => useToastStore.getState().show('info', message),
  success: (message: string) => useToastStore.getState().show('success', message),
  warning: (message: string) => useToastStore.getState().show('warning', message),
  error: (message: string) => useToastStore.getState().show('error', message),
}
