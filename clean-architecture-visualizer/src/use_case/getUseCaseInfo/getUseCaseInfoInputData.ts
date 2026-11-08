export class GetUseCaseInfoInputData {
  constructor(private readonly useCaseId: string) {}

  getUseCaseId(): string {
    return this.useCaseId;
  }
}
