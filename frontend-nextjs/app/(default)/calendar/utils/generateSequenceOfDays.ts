export const generateSequenceOfDays = (firstDayId: number, lastDayId: number): number[] => {
  const result: number[] = [];
  
  for (let i = firstDayId; i <= lastDayId; i++) {
    result.push(i);
  }
  
  return result;
}