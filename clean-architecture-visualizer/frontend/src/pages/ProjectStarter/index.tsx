import { Alert, Box, Divider, Snackbar } from '@mui/material';
import { useState } from 'react';
import '../../i18n/config';
import { useTranslation } from 'react-i18next';
import {
  useCreateUseCase,
  useGenerateProject,
} from '../../actions/use-template';
import {
  ActionCenter,
  DarkButton,
  FieldLabel,
  InputContainer,
  PageWrapper,
  Section,
  StyledTextField,
  Title,
} from './layout';

const ProjectStarter = () => {
  const { t } = useTranslation('projectStarter');
  const [useCaseName, setUseCaseName] = useState('');

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const { mutate: triggerGenerate, isPending: isGenerating } =
    useGenerateProject();
  const { mutate: triggerCreateUseCase, isPending: isCreating } =
    useCreateUseCase();

  const isWorking = isGenerating || isCreating;

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { error?: string } } })
        .response;
      return response?.data?.error || fallback;
    }

    return fallback;
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // The 'java' is temporary until an option to select programming language is added
  const handleCreateProject = () => {
    triggerGenerate('java', {
      onSuccess: (data) => {
        setSnackbar({
          open: true,
          message: data.message || 'Project structure created!',
          severity: 'success',
        });
      },
      onError: (err: unknown) => {
        const errorMsg = getErrorMessage(err, 'Failed to initialize project');
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      },
    });
  };

  const handleAddUseCase = () => {
    const trimmedName = useCaseName.trim();
    if (!trimmedName) return;

    triggerCreateUseCase(trimmedName, {
      onSuccess: (data) => {
        setSnackbar({
          open: true,
          message: data.message,
          severity: 'success',
        });
        setUseCaseName('');
      },
      onError: (err: unknown) => {
        const errorMsg = getErrorMessage(err, 'Error adding use case');
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      },
    });
  };

  return (
    <PageWrapper maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          alignItems: 'center',
        }}
      >
        <Section sx={{ textAlign: 'center' }}>
          <Title variant="h4">{t('startNew.title')}</Title>
          <ActionCenter>
            <DarkButton
              variant="contained"
              disabled={isWorking}
              onClick={handleCreateProject}
            >
              {isGenerating ? t('startNew.loading') : t('startNew.button')}
            </DarkButton>
          </ActionCenter>
        </Section>

        <Divider sx={{ width: '100%' }} />

        <Section sx={{ textAlign: 'center' }}>
          <Title variant="h4">{t('addUseCase.title')}</Title>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <InputContainer>
              <FieldLabel
                variant="body2"
                component="label"
                htmlFor="use-case-input"
              >
                {t('addUseCase.inputLabel')}
              </FieldLabel>
              <StyledTextField
                id="use-case-input"
                fullWidth
                size="small"
                value={useCaseName}
                onChange={(e) => setUseCaseName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUseCase()}
                disabled={isWorking}
              />
            </InputContainer>

            <DarkButton
              variant="contained"
              disabled={isWorking || !useCaseName.trim()}
              onClick={handleAddUseCase}
            >
              {isCreating ? t('addUseCase.loading') : t('addUseCase.button')}
            </DarkButton>
          </Box>
        </Section>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
};

export default ProjectStarter;
