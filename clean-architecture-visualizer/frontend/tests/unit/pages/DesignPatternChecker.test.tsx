import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { mockPatternAnalyzerResponse } from '@/mocks/data/pattern-analyzer';
import { server } from '@/mocks/server';
import DesignPatternChecker from '@/pages/DesignPatternChecker';
import { fireEvent, render, screen, waitFor } from '../../test-utils';

const URL = '/api/design-patterns/analyze';

// The diagram's canvas (React Flow) needs this browser API, which jsdom lacks.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

// Records the pattern IDs of each analyze request.
const recordRequests = () => {
  const requests: string[][] = [];
  server.use(
    http.post(URL, async ({ request }) => {
      const body = (await request.json()) as { patternIds: string[] };
      requests.push(body.patternIds);
      return HttpResponse.json(mockPatternAnalyzerResponse);
    })
  );
  return requests;
};

describe('DesignPatternChecker', () => {
  it('analyzes as soon as the page opens', async () => {
    const requests = recordRequests();
    render(<DesignPatternChecker />);

    expect(await screen.findByText('Logger')).toBeInTheDocument();
    expect(requests).toEqual([['singleton']]);
  });

  it('highlights pattern members and opens on the pattern class code', async () => {
    render(<DesignPatternChecker />);

    const row = await screen.findByText('- instance: Logger {static}');
    expect(row).toHaveAttribute('data-tone', 'selected');
    expect(screen.getByText('+ log(String): void')).toHaveAttribute(
      'data-tone',
      'none'
    );
    expect(screen.getByText('public class Logger {')).toBeInTheDocument();
  });

  it('only analyzes again when Re-analyze is clicked', async () => {
    const requests = recordRequests();
    render(<DesignPatternChecker />);
    await screen.findByText('Logger');

    const checkbox = screen.getByRole('checkbox', { name: 'Singleton' });
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    expect(requests).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'reAnalyze' }));

    await waitFor(() =>
      expect(requests).toEqual([['singleton'], ['singleton']])
    );
  });

  it('blocks Re-analyze and shows an error until a pattern is selected', async () => {
    render(<DesignPatternChecker />);
    await screen.findByText('Logger');
    const button = screen.getByRole('button', { name: 'reAnalyze' });
    const checkbox = screen.getByRole('checkbox', { name: 'Singleton' });

    fireEvent.click(checkbox);

    expect(button).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('noPatternSelected');

    fireEvent.click(checkbox);

    expect(button).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a clicked class in the Code tab', async () => {
    render(<DesignPatternChecker />);

    fireEvent.click(await screen.findByRole('button', { name: 'Report' }));

    expect(screen.getByText('public class Report {')).toBeInTheDocument();
  });

  it('explains the selected pattern in the Learn tab', async () => {
    render(<DesignPatternChecker />);
    await screen.findByText('Logger');

    fireEvent.click(screen.getByRole('tab', { name: 'tabs.learn' }));

    expect(screen.getByText('Singleton?')).toBeInTheDocument();
    expect(
      screen.getByText('Ensures a class has only one instance.')
    ).toBeInTheDocument();
  });

  it('says so when no pattern is detected', async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json({
          ...mockPatternAnalyzerResponse,
          patternInstances: [],
        })
      )
    );
    render(<DesignPatternChecker />);

    expect(await screen.findByText('noneDetected')).toBeInTheDocument();
  });

  it('shows the reason an analysis failed and can still re-analyze', async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json({ error: 'java not found' }, { status: 500 })
      )
    );
    render(<DesignPatternChecker />);

    expect(await screen.findByText(/java not found/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'reAnalyze' })).toBeEnabled();
  });
});
