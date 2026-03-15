export const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};
