export class Utils {
  public static getCurrentDate = (): string => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  public static getRandomIntInclusive = (min: number, max: number): number => {
    // Use Math.ceil to ensure min is rounded up to the nearest integer
    min = Math.ceil(min);
    // Use Math.floor to ensure max is rounded down to the nearest integer
    max = Math.floor(max);
    // The expression scales the random number to the desired range
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
}
