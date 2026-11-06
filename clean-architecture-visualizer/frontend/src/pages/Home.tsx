import React from 'react';
import '../i18n/config';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import CaveLogo from '../assets/locales/logo_dark.svg';
import HomeButtonGrid from '../components/common/HomeButtonGrid';
import InfoDialog from '../components/common/InfoDialog';

const Home = () => {
  const { t } = useTranslation('home');
  const [infoOpen, setInfoOpen] = React.useState(false);

  // Define the navigation data for the grid
  const navItems = [
    {
      title: t('cards.checker.title'),
      description: t('cards.checker.description'),
      to: '/checker',
      icon: <CheckCircleOutlineIcon />,
      iconColor: 'adapters.main',
      badge: t('cards.checker.badge'),
      badgeBg: 'adapters.light',
      badgeColor: 'adapters.dark',
      ctaLabel: t('cards.checker.cta'),
      ctaColor: 'adapters.dark',
    },
    { // TODO: make this unique
      title: t('cards.designPatterns.title'),
      description: t('cards.designPatterns.description'),
      to: '/design-pattern-checker',
      icon: <AccountTreeOutlinedIcon />,
      iconColor: 'adapters.main',
      badge: t('cards.designPatterns.badge'),
      badgeBg: 'adapters.light',
      badgeColor: 'adapters.dark',
      ctaLabel: t('cards.designPatterns.cta'),
      ctaColor: 'adapters.dark',
    },
    {
      title: t('cards.learn.title'),
      description: t('cards.learn.description'),
      to: 'https://ca-visualizer-for-education.github.io/cave-learn/',
      icon: <MenuBookIcon />,
      iconColor: 'drivers.main',
      badge: t('cards.learn.badge'),
      badgeBg: 'drivers.light',
      badgeColor: 'drivers.dark',
      ctaLabel: t('cards.learn.cta'),
      ctaColor: 'drivers.dark',
    },
    {
      title: t('cards.starter.title'),
      description: t('cards.starter.description'),
      to: '/project-starter',
      icon: <AssignmentOutlinedIcon />,
      iconColor: 'useCases.dark',
      badge: t('cards.starter.badge'),
      badgeBg: 'useCases.light',
      badgeColor: 'useCases.dark',
      ctaLabel: t('cards.starter.cta'),
      ctaColor: 'useCases.dark',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 10, position: 'relative' }}>
      <Box
        mb={12}
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={3}
      >
        <Box
          component="img"
          src={CaveLogo}
          alt="CAVE Logo"
          sx={{ height: 60 }}
        />
        <Typography variant="h3" component="h1" fontWeight="800">
          {t('title')}
        </Typography>
      </Box>

      {/* Info card */}
      <IconButton
        sx={{ position: 'fixed', bottom: 20, right: 30 }}
        onClick={() => setInfoOpen(true)}
        aria-label={t('infoDialog.title')}
        title={t('infoDialog.title')}
      >
        <InfoOutlinedIcon fontSize="large" />
      </IconButton>

      <InfoDialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={t('infoDialog.title')}
        buttonText={t('infoDialog.button')}
        content={
          <Trans
            i18nKey="infoDialog.content"
            t={t}
            components={{ br: <br />, strong: <strong /> }}
          />
        }
      />

      {/* Reusable Grid Component for Nav Cards */}
      <HomeButtonGrid items={navItems} />
    </Container>
  );
};

export default Home;
