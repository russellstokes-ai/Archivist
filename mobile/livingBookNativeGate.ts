/** Only the active WebView AND its most recent probe may change book state.
 * Deliberately pure for no-native regression testing, zero renderer changes. */
export function livingBookCallbackAllowed(
  callbackKey:number,currentKey:number,suspended:boolean,failed:boolean
):boolean {
  return Number.isSafeInteger(callbackKey)&&callbackKey>=0&&
    callbackKey===currentKey&&!suspended&&!failed;
}
export function livingBookProbeAllowed(
  callbackKey:number,currentKey:number,responseTicket:number,activeTicket:number,
  suspended:boolean,failed:boolean
):boolean {
  return livingBookCallbackAllowed(callbackKey,currentKey,suspended,failed)&&
    Number.isSafeInteger(responseTicket)&&responseTicket>0&&
    responseTicket===activeTicket;
}
