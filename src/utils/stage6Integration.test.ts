import {
  DemoSurveyorProfilesRepository,
  DemoSurveyorSelectionsRepository,
  DemoPublishedPricesRepository,
  DemoSurveyorReviewsRepository,
  DemoCredentialsRepository,
} from '../repositories/demo/DemoStage6Repositories';
import { DemoProjectRepository } from '../repositories/demo/DemoProjectRepository';
import { DemoProfileRepository } from '../repositories/demo/DemoProfileRepository';
import { DemoAuthRepository } from '../repositories/demo/DemoAuthRepository';
import { RepositoryActor, SurveyorReview } from '../models/Stage6Models';

type Result = { testNumber: number; title: string; passed: boolean; message: string };
const memory = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, String(value)),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() { return memory.size; },
};
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });
}

const client: RepositoryActor = { userId: 'client-stage6', role: 'client', environment: 'demo' };
const otherClient: RepositoryActor = { userId: 'client-other', role: 'client', environment: 'demo' };
const surveyor: RepositoryActor = { userId: 'demo-user-123', role: 'surveyor', environment: 'demo' };
const admin: RepositoryActor = { userId: 'admin-stage6', role: 'admin', environment: 'demo' };
const expectReject = async (action: () => Promise<unknown>) => {
  try { await action(); return false; } catch { return true; }
};

export async function runStage6IntegrationTests() {
  localStorage.clear();
  const results: Result[] = [];
  const test = async (title: string, action: () => boolean | Promise<boolean>) => {
    try {
      const passed = await action();
      results.push({ testNumber: results.length + 1, title, passed, message: passed ? 'موفق' : 'شرط آزمون برقرار نشد' });
    } catch (error) {
      results.push({ testNumber: results.length + 1, title, passed: false, message: error instanceof Error ? error.message : String(error) });
    }
  };

  const profiles = new DemoSurveyorProfilesRepository('demo');
  const selections = new DemoSurveyorSelectionsRepository('demo');
  const reviews = new DemoSurveyorReviewsRepository('demo');
  const projects = new DemoProjectRepository();
  let selectionId = '';

  await test('مهمان پیش از استعلام تلفن را نبیند', async () => (await profiles.getProfileByUserId(surveyor.userId))?.phone === undefined);
  await test('کارفرما پیش از استعلام تلفن را نبیند', async () => (await profiles.getProfileByUserId(surveyor.userId, client))?.phone === undefined);
  await test('ثبت استعلام Project ایجاد نکند', async () => {
    const before = (await projects.getProjects(client.userId)).length;
    const created = await selections.createSelection(client, {
      clientId: client.userId, clientName: 'کارفرمای تست', clientPhone: '09121111111',
      surveyorId: surveyor.userId, surveyorName: 'نقشه‌بردار تست', serviceRequestedTitle: 'UTM',
      location: 'یزد', inquiryNotes: 'آزمون',
    });
    selectionId = created.id;
    return (await projects.getProjects(client.userId)).length === before;
  });
  await test('تلفن در رکورد ذخیره‌شده Selection وجود نداشته باشد', () => {
    const raw = JSON.parse(localStorage.getItem('surveying_demo_selections_v1') || '[]') as Array<Record<string, unknown>>;
    return raw.every((item) => !Object.prototype.hasOwnProperty.call(item, 'surveyorPhone'));
  });
  await test('همان کارفرما پس از استعلام تلفن را ببیند', async () => Boolean((await profiles.getProfileByUserId(surveyor.userId, client))?.phone));
  await test('کارفرمای دیگر تلفن را نبیند', async () => (await profiles.getProfileByUserId(surveyor.userId, otherClient))?.phone === undefined);
  await test('مدیر بدون استعلام تلفن را نبیند', async () => (await profiles.getProfileByUserId(surveyor.userId, admin))?.phone === undefined);
  await test('خواندن مستقیم Selection توسط غیرمالک رد شود', () => expectReject(() => selections.getSelectionById(selectionId, otherClient)));
  await test('تغییر وضعیت توسط غیرنقشه‌بردار رد شود', () => expectReject(() => selections.updateSelectionStatus(client, selectionId, 'completed')));
  await test('نقشه‌بردار بتواند همکاری را completed کند', async () => (await selections.updateSelectionStatus(surveyor, selectionId, 'completed')).status === 'completed');

  const validReview = (): Omit<SurveyorReview, 'id' | 'createdAt' | 'createdAtJalali' | 'environment' | 'isApproved' | 'isReported'> => ({
    surveyorId: surveyor.userId, clientId: client.userId, clientName: 'کارفرمای تست', selectionId,
    overallRating: 5, ratings: { accuracy: 5, punctuality: 4, communication: 5, pricingFairness: 4 },
    projectType: 'UTM', comment: 'همکاری انجام شد.',
  });
  await test('امتیاز اعشاری یا خارج ۱ تا ۵ رد شود', () => expectReject(() => reviews.submitReview(client, { ...validReview(), overallRating: 4.5 })));
  await test('امتیازدهی به خود رد شود', () => expectReject(() => reviews.submitReview({ ...client, userId: surveyor.userId }, { ...validReview(), clientId: surveyor.userId })));
  await test('نظر برای Selection ناموجود رد شود', () => expectReject(() => reviews.submitReview(client, { ...validReview(), selectionId: 'missing' })));
  await test('نظر معتبر پس از completed ذخیره شود', async () => (await reviews.submitReview(client, validReview())).overallRating === 5);
  await test('نظر فعال دوم برای همان Selection رد شود', () => expectReject(() => reviews.submitReview(client, validReview())));
  await test('moderation توسط غیرمدیر رد شود', async () => {
    const mine = await reviews.getReviewsByClient(client);
    return expectReject(() => reviews.moderateReview(surveyor, mine[0].id, false));
  });
  await test('مدیر فقط بتواند نظر را مخفی کند و امتیاز تغییر نکند', async () => {
    const mine = await reviews.getReviewsByClient(client);
    const score = mine[0].overallRating;
    const hidden = await reviews.moderateReview(admin, mine[0].id, false, 'بررسی نمایشی');
    return !hidden.isApproved && hidden.overallRating === score;
  });
  await test('نظر مخفی در میانگین و تعداد لحاظ نشود', async () => {
    const aggregate = await reviews.getReviewAggregate(surveyor.userId);
    return aggregate.totalReviews === 5;
  });
  await test('مشاهده نظرات مخفی توسط غیرمدیر رد شود', () => expectReject(() => reviews.getReviewsForSurveyor(surveyor.userId, client, true)));
  await test('تأیید مدرک توسط غیرمدیر رد شود', () => expectReject(() => new DemoCredentialsRepository('demo').verifyCredential(surveyor, 'cred-1', true)));
  await test('متد تغییر مستقیم نقش از Auth حذف شده باشد', () => !('updateDemoRole' in new DemoAuthRepository()));
  await test('PII پروفایل ذخیره نشود', async () => {
    const profileRepo = new DemoProfileRepository();
    await profileRepo.updateProfile(client.userId, { province: 'یزد', city: 'یزد', address: 'secret', nationalId: '123', bankIban: 'IR-secret' } as never);
    const raw = localStorage.getItem(`geo_demo_profile_${client.userId}`) || '';
    return !raw.includes('secret') && !raw.includes('nationalId') && !raw.includes('bankIban') && !raw.includes('address');
  });
  await test('کلیدها و داده Demo و Real کاملاً جدا باشند', async () => {
    const realSelections = new DemoSurveyorSelectionsRepository('real');
    const realClient: RepositoryActor = { userId: 'real-client', role: 'client', environment: 'real' };
    await realSelections.createSelection(realClient, {
      clientId: realClient.userId, clientName: 'Real', clientPhone: '09120000000', surveyorId: 'real-surveyor',
      surveyorName: 'Real Surveyor', serviceRequestedTitle: 'Real service', location: 'تهران', inquiryNotes: 'real',
    });
    return Boolean(localStorage.getItem('surveying_real_selections_v1')) &&
      !String(localStorage.getItem('surveying_demo_selections_v1')).includes('real-client') &&
      (await expectReject(() => realSelections.getSelectionsForClient(client)));
  });
  await test('تعرفه عمومی اطلاعات مالی داخلی نداشته باشد', async () => {
    const cards = await new DemoPublishedPricesRepository('demo').getAllPublishedPriceCards();
    return cards.every((card) => !('actualCost' in card) && !('profit' in card) && !('tax' in card) && !('personalRate' in card));
  });

  return results;
}
