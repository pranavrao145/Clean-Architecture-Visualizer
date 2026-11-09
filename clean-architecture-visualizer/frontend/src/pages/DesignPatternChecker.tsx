import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePatternAnalyzer } from '../actions/use-pattern-analyzer';
import { CodeLearnPanel } from '../components/PatternAnalyzer/CodeLearnPanel';
import {
  type SelectElement,
  UmlDiagram,
} from '../components/PatternAnalyzer/UmlDiagram';
import {
  AVAILABLE_PATTERNS,
  buildPatternAnalyzerViewModel,
  HIGHLIGHT_COLORS,
  type HighlightTone,
} from '../lib/pattern-analyzer-view-model';

const LEGEND_TONES: HighlightTone[] = ['selected', 'unselected', 'antiPattern'];

/** Prefers the server's explanation, such as why Java failed. */
const errorDetail = (error: Error): string =>
  (axios.isAxiosError(error) && error.response?.data?.error) || error.message;

const DesignPatternChecker = () => {
  const { t } = useTranslation('patternAnalyzer');
  const [checkedPatternIds, setCheckedPatternIds] = useState(
    AVAILABLE_PATTERNS.map((pattern) => pattern.id)
  );
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>();
  const [selectedClassFqn, setSelectedClassFqn] = useState<string>();

  // Runs as soon as the page opens; the button below runs it again.
  const { data, error, isFetching, refetch } =
    usePatternAnalyzer(checkedPatternIds);
  const noPatternChecked = checkedPatternIds.length === 0;

  const viewModel = useMemo(
    () =>
      data &&
      buildPatternAnalyzerViewModel(data, selectedInstanceId, selectedClassFqn),
    [data, selectedInstanceId, selectedClassFqn]
  );

  const togglePattern = (patternId: string) => {
    setCheckedPatternIds((checked) =>
      checked.includes(patternId)
        ? checked.filter((id) => id !== patternId)
        : [...checked, patternId]
    );
  };

  const selectInstance = (instanceId: string, classFqn?: string) => {
    setSelectedInstanceId(instanceId);
    setSelectedClassFqn(classFqn);
  };

  // Clicking a part of a pattern selects that pattern, and the class around it.
  const selectElement = useCallback<SelectElement>((classFqn, instanceIds) => {
    setSelectedClassFqn(classFqn);
    if (instanceIds.length > 0) setSelectedInstanceId(instanceIds[0]);
  }, []);

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}
    >
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ alignItems: 'center', flexWrap: 'wrap', px: 2, py: 1 }}
      >
        <Typography variant="h6" component="h1" sx={{ fontWeight: 800 }}>
          {t('title')}
        </Typography>

        {AVAILABLE_PATTERNS.map((pattern) => (
          <FormControlLabel
            key={pattern.id}
            label={pattern.name}
            control={
              <Checkbox
                size="small"
                color="default"
                checked={checkedPatternIds.includes(pattern.id)}
                onChange={() => togglePattern(pattern.id)}
              />
            }
          />
        ))}

        <Button
          variant="outlined"
          color="inherit"
          disabled={isFetching || noPatternChecked}
          onClick={() => refetch()}
        >
          {t('reAnalyze')}
        </Button>
        {isFetching && <CircularProgress size={20} />}

        {viewModel && (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Typography variant="body2">
              {viewModel.patternInstances.length > 0
                ? t('detected')
                : t('noneDetected')}
            </Typography>
            {viewModel.patternInstances.map((instance) => {
              const isSelected = instance.id === viewModel.selectedInstance?.id;
              return (
                <Chip
                  key={instance.id}
                  size="small"
                  label={`${instance.patternName}: ${instance.classFqns.join(', ')}`}
                  aria-pressed={isSelected}
                  onClick={() =>
                    selectInstance(instance.id, instance.classFqns[0])
                  }
                  sx={{
                    color: 'text.primary',
                    bgcolor: isSelected
                      ? HIGHLIGHT_COLORS.selected
                      : HIGHLIGHT_COLORS.unselected,
                  }}
                />
              );
            })}
          </Stack>
        )}

        <Stack direction="row" spacing={1.5} sx={{ ml: 'auto' }}>
          {LEGEND_TONES.map((tone) => (
            <Stack
              key={tone}
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center' }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: 1,
                  bgcolor: HIGHLIGHT_COLORS[tone],
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
              <Typography variant="caption">{t(`legend.${tone}`)}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      {noPatternChecked && (
        <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
          {t('noPatternSelected')}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
          {t('error')} {errorDetail(error)}
        </Alert>
      )}

      {viewModel && (
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            minHeight: 500,
            height: 'calc(100vh - 150px)',
            bgcolor: 'background.paper',
            borderTop: '2px solid',
            borderColor: 'text.primary',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <UmlDiagram viewModel={viewModel} onSelect={selectElement} />
          </Box>
          <Box
            sx={{
              width: 380,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '2px solid',
              borderColor: 'text.primary',
            }}
          >
            <CodeLearnPanel viewModel={viewModel} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DesignPatternChecker;
