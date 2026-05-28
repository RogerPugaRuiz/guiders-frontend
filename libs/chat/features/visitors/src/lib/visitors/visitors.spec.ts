import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { VisitorsComponent } from './visitors';
import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';
import { USE_MOCK_DATA } from '@guiders-frontend/shared/config';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import {
  TourSandboxService,
  DEMO_VISITOR_ID,
} from '@guiders-frontend/tour-sandbox';

const mockSearchResponse = {
  visitors: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

function buildMockVisitorsService() {
  return {
    searchVisitors: vi.fn(() => of(mockSearchResponse)),
    getVisitorStats: vi.fn(() => of(null)),
    getQuickFilters: vi.fn(() => of({ filters: [] })),
    getCompanySites: vi.fn(() => of({ sites: [], companyId: '', companyName: '', totalSites: 0 })),
    assignChatToCommercial: vi.fn(() => of({})),
  };
}

const mockEnvironment = {
  production: false,
  api: { baseUrl: 'http://localhost:3000' },
  auth: { authority: '', clientId: '', scope: '', secureRoutes: [] },
};

describe('VisitorsComponent', () => {
  let component: VisitorsComponent;
  let fixture: ComponentFixture<VisitorsComponent>;
  let mockVisitorsService: ReturnType<typeof buildMockVisitorsService>;

  beforeEach(async () => {
    mockVisitorsService = buildMockVisitorsService();

    await TestBed.configureTestingModule({
      imports: [VisitorsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VisitorsDataService, useValue: mockVisitorsService },
        { provide: USE_MOCK_DATA, useValue: false },
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorsComponent);
    component = fixture.componentInstance;
    // Set a companyId so refreshVisitorsSilently() does not bail out
    component.companyId.set('test-company-id');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('AC1: default auto-refresh interval is 30s when no localStorage value exists', () => {
    localStorage.removeItem('visitors_auto_refresh_interval');
    // Re-read by calling the private method via bracket notation
    const defaultMs = (component as unknown as Record<string, () => number>)['loadAutoRefreshInterval']();
    expect(defaultMs).toBe(30000);
  });

  it('AC2: autoRefreshOptions contains exactly the five required options', () => {
    const values = component.autoRefreshOptions.map(o => o.value);
    expect(values).toEqual([0, 10000, 30000, 60000, 300000]);
  });

  it('AC4: onAutoRefreshIntervalChange persists interval to localStorage', fakeAsync(() => {
    component.onAutoRefreshIntervalChange(10000);
    expect(localStorage.getItem('visitors_auto_refresh_interval')).toBe('10000');
    discardPeriodicTasks();
  }));

  it('AC8: polling triggers searchVisitors after the configured interval elapses', fakeAsync(() => {
    fixture.detectChanges();

    // Disable default 30s interval before switching to 10s to avoid stale ticks
    component.onAutoRefreshIntervalChange(0);
    const callsBefore = mockVisitorsService.searchVisitors.mock.calls.length;

    // Switch to 10s interval
    component.onAutoRefreshIntervalChange(10000);

    // Advance 10s — the interval should fire once
    tick(10001);

    expect(mockVisitorsService.searchVisitors.mock.calls.length).toBeGreaterThan(callsBefore);

    discardPeriodicTasks();
  }));

  it('AC9: polling stops after component is destroyed', fakeAsync(() => {
    fixture.detectChanges();
    component.onAutoRefreshIntervalChange(10000);

    // Let one tick fire
    tick(10001);
    const callsBeforeDestroy = mockVisitorsService.searchVisitors.mock.calls.length;

    // Destroy component — takeUntilDestroyed should complete the stream
    fixture.destroy();

    // Advance another full interval — no new calls expected
    tick(10000);
    expect(mockVisitorsService.searchVisitors.mock.calls.length).toBe(callsBeforeDestroy);

    discardPeriodicTasks();
  }));

  it('AC5: ariaAnnouncement is updated after a successful refresh', fakeAsync(() => {
    mockVisitorsService.searchVisitors.mockReturnValue(of({
      ...mockSearchResponse,
      pagination: { ...mockSearchResponse.pagination, total: 5 },
    }));

    fixture.detectChanges();
    component.onAutoRefreshIntervalChange(0); // disable any running interval first
    component.onAutoRefreshIntervalChange(10000);
    tick(10001);
    tick(300); // allow microtask queue to flush observable emissions

    expect(component.ariaAnnouncement()).toContain('5 visitantes activos');

    discardPeriodicTasks();
  }));
});

describe('VisitorsComponent · TourSandbox integration', () => {
  let component: VisitorsComponent;
  let fixture: ComponentFixture<VisitorsComponent>;
  let mockVisitorsService: ReturnType<typeof buildMockVisitorsService>;
  let sandbox: TourSandboxService;

  beforeEach(async () => {
    mockVisitorsService = buildMockVisitorsService();

    await TestBed.configureTestingModule({
      imports: [VisitorsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VisitorsDataService, useValue: mockVisitorsService },
        { provide: USE_MOCK_DATA, useValue: false },
        { provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment },
      ],
    }).compileComponents();

    sandbox = TestBed.inject(TourSandboxService);
    fixture = TestBed.createComponent(VisitorsComponent);
    component = fixture.componentInstance;
    component.companyId.set('test-company-id');
  });

  afterEach(() => {
    sandbox.deactivate();
  });

  it('prepends the demo visitor to the list when the sandbox is active after a search', fakeAsync(() => {
    sandbox.activate();
    fixture.detectChanges();
    component.loadVisitors();
    tick(0);

    const visitors = component.state().visitors;
    expect(visitors.length).toBeGreaterThanOrEqual(1);
    expect(visitors[0].id).toBe(DEMO_VISITOR_ID);

    discardPeriodicTasks();
  }));

  it('does NOT add the demo visitor when the sandbox is inactive', fakeAsync(() => {
    fixture.detectChanges();
    component.loadVisitors();
    tick(0);

    const ids = component.state().visitors.map((v) => v.id);
    expect(ids).not.toContain(DEMO_VISITOR_ID);

    discardPeriodicTasks();
  }));

  it('keeps the demo visitor on top after the polling refresh tick', fakeAsync(() => {
    sandbox.activate();
    fixture.detectChanges();
    component.loadVisitors();
    tick(0);

    component.onAutoRefreshIntervalChange(0);
    component.onAutoRefreshIntervalChange(10000);
    tick(10001);
    tick(0);

    const visitors = component.state().visitors;
    expect(visitors[0].id).toBe(DEMO_VISITOR_ID);

    discardPeriodicTasks();
  }));

  it('does not duplicate the demo visitor if the backend already returns it', fakeAsync(() => {
    sandbox.activate();
    mockVisitorsService.searchVisitors.mockReturnValue(
      of({
        ...mockSearchResponse,
        visitors: [
          {
            id: DEMO_VISITOR_ID,
            connectionStatus: 'online',
            lastActivityAt: new Date().toISOString(),
            currentUrl: '/x',
            createdAt: new Date().toISOString(),
          },
        ],
        pagination: { ...mockSearchResponse.pagination, total: 1 },
      }),
    );
    fixture.detectChanges();
    component.loadVisitors();
    tick(0);

    const occurrences = component
      .state()
      .visitors.filter((v) => v.id === DEMO_VISITOR_ID).length;
    expect(occurrences).toBe(1);

    discardPeriodicTasks();
  }));
});
