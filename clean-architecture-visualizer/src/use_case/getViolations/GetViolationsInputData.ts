export class GetViolationsInputData {
  constructor(private readonly useCaseId: string) {}

  getUseCaseId(): string {
    return this.useCaseId;
  }
}
