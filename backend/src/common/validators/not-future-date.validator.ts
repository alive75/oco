import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'notFutureDate', async: false })
export class NotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(dateString: any, args: ValidationArguments) {
    if (typeof dateString !== 'string') {
      return false;
    }

    const date = new Date(dateString);
    const now = new Date();
    
    // Set both dates to start of day for comparison (ignore time)
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Allow today and past dates, but not future dates
    return inputDate <= today;
  }

  defaultMessage(args: ValidationArguments) {
    return 'A data não pode ser no futuro';
  }
}