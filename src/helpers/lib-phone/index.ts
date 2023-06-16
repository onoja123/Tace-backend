import { PhoneNumberUtil, PhoneNumberFormat } from "google-libphonenumber";

class Phone {
  private phoneUtil = PhoneNumberUtil.getInstance();

  public format(phone: string, region: string): string {
    const phoneNumber = this.phoneUtil.parse(phone, region);
    return this.phoneUtil.format(phoneNumber, PhoneNumberFormat.INTERNATIONAL);
  }

  public isValid(phone: string, region?: string): boolean {
    try {
      const phoneNumber = this.phoneUtil.parse(phone, region);
      return this.phoneUtil.isValidNumber(phoneNumber);
    } catch (err) {
      return false;
    }
  }

  public getRegionCode(phone: string): string {
    try {
      const phoneNumber = this.phoneUtil.parse(phone);
      return this.phoneUtil.getRegionCodeForNumber(phoneNumber) || "";
    } catch (err) {
      return "";
    }
  }

  public getInternationNumber(phone: string, region?: string): string {
    // dont call this function without making sure the number is valid eg: isValid()
    // this.phoneUtil.format(phoneNumber, PhoneNumberFormat.E164),
    try {
      const phoneNumber = this.phoneUtil.parse(phone, region);
      if (this.phoneUtil.isValidNumber(phoneNumber)) {
        return this.phoneUtil.format(phoneNumber, PhoneNumberFormat.E164);
      }
      return "";
    } catch (err) {
      return "";
    }
  }

  public getCountryCode(phone: string): number {
    try {
      const phoneNumber = this.phoneUtil.parse(phone);
      return phoneNumber.getCountryCode() || 0;
    } catch (err) {
      return 0;
    }
  }

  public getNationalNumber(phone: string): number {
    try {
      const phoneNumber = this.phoneUtil.parse(phone);
      return phoneNumber.getNationalNumber() || 0;
    } catch (err) {
      return 0;
    }
  }
}

export default Phone;
