import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type ClassBox,
  HIGHLIGHT_COLORS,
  type HighlightTone,
  type PatternAnalyzerViewModel,
} from '../../lib/pattern-analyzer-view-model';

const CodeLine = ({
  text,
  tone,
  indent = false,
}: {
  text: string;
  tone: HighlightTone;
  indent?: boolean;
}) => (
  <Box
    data-tone={tone}
    sx={{
      ml: indent ? 2 : 0,
      px: 1,
      py: 0.25,
      borderRadius: 2,
      fontFamily: 'monospace',
      fontSize: 13,
      overflowWrap: 'anywhere',
      bgcolor: HIGHLIGHT_COLORS[tone],
    }}
  >
    {text}
  </Box>
);

const CodeTab = ({ selectedClass }: { selectedClass?: ClassBox }) => {
  const { t } = useTranslation('patternAnalyzer');

  if (!selectedClass) return <Typography>{t('code.selectClass')}</Typography>;

  return (
    <>
      <CodeLine text={selectedClass.codeText} tone={selectedClass.tone} />
      {selectedClass.members.map((member) => (
        <CodeLine
          key={member.fqn}
          text={member.codeText}
          tone={member.tone}
          indent
        />
      ))}
      <CodeLine text="}" tone="none" />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 2 }}
      >
        {t('code.note')}
      </Typography>
    </>
  );
};

const LearnTab = ({ viewModel }: { viewModel: PatternAnalyzerViewModel }) => {
  const { t } = useTranslation('patternAnalyzer');
  const { selectedInstance, classes } = viewModel;

  if (!selectedInstance) {
    return <Typography>{t('learn.selectPattern')}</Typography>;
  }

  // The selected instance's own classes and members, shown as a worked example.
  const exampleClasses = classes.filter((box) =>
    selectedInstance.classFqns.includes(box.fqn)
  );

  return (
    <>
      <Typography variant="h6" component="h2" gutterBottom>
        {t('learn.whatIs')}{' '}
        <Box
          component="span"
          sx={{
            px: 1,
            borderRadius: 2,
            bgcolor: HIGHLIGHT_COLORS.selected,
          }}
        >
          {selectedInstance.patternName}?
        </Box>
      </Typography>
      <Typography sx={{ mb: 2 }}>{selectedInstance.description}</Typography>

      <Box sx={{ border: '2px solid', borderColor: 'text.primary', p: 1.5 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('learn.inYourCode')}
        </Typography>
        {exampleClasses.map((box) => (
          <Box key={box.fqn} sx={{ fontFamily: 'monospace', fontSize: 13 }}>
            <strong>{box.name}</strong>
            {box.members
              .filter((member) =>
                selectedInstance.memberFqns.includes(member.fqn)
              )
              .map((member) => (
                <Box key={member.fqn}>{member.umlText}</Box>
              ))}
          </Box>
        ))}
      </Box>

      <Typography sx={{ mt: 2 }}>{selectedInstance.learningInfo}</Typography>
    </>
  );
};

export const CodeLearnPanel = ({
  viewModel,
}: {
  viewModel: PatternAnalyzerViewModel;
}) => {
  const { t } = useTranslation('patternAnalyzer');
  const [tab, setTab] = useState<'code' | 'learn'>('code');

  return (
    <>
      <Tabs
        value={tab}
        onChange={(_event, value) => setTab(value)}
        aria-label={t('tabs.label')}
        textColor="inherit"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': { bgcolor: 'text.primary' },
        }}
      >
        <Tab value="code" label={t('tabs.code')} />
        <Tab value="learn" label={t('tabs.learn')} />
      </Tabs>
      <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
        {tab === 'code' ? (
          <CodeTab selectedClass={viewModel.selectedClass} />
        ) : (
          <LearnTab viewModel={viewModel} />
        )}
      </Box>
    </>
  );
};
