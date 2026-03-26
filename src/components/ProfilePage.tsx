import { useState, useEffect, useRef } from 'react';
import { useNotify, useTranslate, useLocaleState, usePermissions } from 'react-admin';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';

import { useLocaleSettings } from '../hooks/useLocaleSettings.ts';
import { PageHeader } from './PageHeader.tsx';

const entrypoint = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface ImageData {
  url: string;
  storagePath: string;
  mimeType: string;
  filename: string;
}

interface MeData {
  username: string;
  email: string;
  roles: string[];
  avatar: ImageData | null;
  banner: ImageData | null;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchMe(): Promise<MeData> {
  const response = await fetch(`${entrypoint}/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
}

async function updateMe(data: Record<string, string>): Promise<MeData> {
  const response = await fetch(`${entrypoint}/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save profile');
  return response.json();
}

async function uploadImage(field: 'avatar' | 'banner', file: File): Promise<{ avatar: ImageData | null; banner: ImageData | null }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${entrypoint}/me/${field}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  return response.json();
}

async function deleteImage(field: 'avatar' | 'banner'): Promise<{ avatar: ImageData | null; banner: ImageData | null }> {
  const response = await fetch(`${entrypoint}/me/${field}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Delete failed');
  return response.json();
}

export function ProfilePage() {
  const translate = useTranslate();
  const notify = useNotify();
  const [raLocale, setRaLocale] = useLocaleState();
  const { supportedLocales } = useLocaleSettings();
  const { permissions } = usePermissions();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedLocale, setSelectedLocale] = useState(raLocale);
  const [originalUsername, setOriginalUsername] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const [avatar, setAvatar] = useState<ImageData | null>(null);
  const [banner, setBanner] = useState<ImageData | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMe().then((data) => {
      setUsername(data.username);
      setEmail(data.email);
      setRoles(data.roles);
      setOriginalUsername(data.username);
      setOriginalEmail(data.email);
      setAvatar(data.avatar);
      setBanner(data.banner);
    });
  }, []);

  useEffect(() => {
    setSelectedLocale(raLocale);
  }, [raLocale]);

  const profileChanged = username !== originalUsername || email !== originalEmail;
  const localeChanged = selectedLocale !== raLocale;
  const hasChanges = profileChanged || localeChanged;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (username !== originalUsername) payload.username = username;
      if (email !== originalEmail) payload.email = email;

      if (Object.keys(payload).length > 0) {
        const updated = await updateMe(payload);
        setOriginalUsername(updated.username);
        setOriginalEmail(updated.email);
      }

      if (localeChanged) {
        setRaLocale(selectedLocale);
      }

      notify('psyched.profile.saved', { type: 'success', messageArgs: { _: 'Profile saved' } });
    } catch {
      notify('psyched.profile.save_failed', { type: 'error', messageArgs: { _: 'Failed to save' } });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (field: 'avatar' | 'banner', file: File) => {
    const setUploading = field === 'avatar' ? setUploadingAvatar : setUploadingBanner;
    setUploading(true);
    try {
      const result = await uploadImage(field, file);
      setAvatar(result.avatar);
      setBanner(result.banner);
      notify('psyched.profile.image_uploaded', { type: 'success', messageArgs: { _: 'Image uploaded' } });
    } catch (e) {
      notify('psyched.profile.image_upload_failed', {
        type: 'error',
        messageArgs: { _: e instanceof Error ? e.message : 'Upload failed' },
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (field: 'avatar' | 'banner') => {
    try {
      const result = await deleteImage(field);
      setAvatar(result.avatar);
      setBanner(result.banner);
      notify('psyched.profile.image_deleted', { type: 'success', messageArgs: { _: 'Image deleted' } });
    } catch {
      notify('psyched.profile.image_delete_failed', { type: 'error', messageArgs: { _: 'Delete failed' } });
    }
  };

  const handleFileChange = (field: 'avatar' | 'banner') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(field, file);
      e.target.value = '';
    }
  };

  return (
    <>
      <PageHeader title={translate('psyched.profile.title', { _: 'My Profile' })} />

      {/* Banner */}
      <Card variant="outlined" sx={{ mb: 3, overflow: 'visible' }}>
        <Box
          sx={{
            position: 'relative',
            height: 200,
            bgcolor: 'grey.100',
            backgroundImage: banner ? `url(${banner.url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '4px 4px 0 0',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 8, right: 8 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={uploadingBanner ? <CircularProgress size={16} color="inherit" /> : <PhotoCameraIcon />}
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              sx={{ bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
            >
              {translate('psyched.profile.change_banner', { _: 'Change banner' })}
            </Button>
            {banner && (
              <IconButton
                size="small"
                onClick={() => handleImageDelete('banner')}
                sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={handleFileChange('banner')}
          />

          {/* Avatar overlapping banner */}
          <Box sx={{ position: 'absolute', bottom: -40, left: 24 }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={avatar?.url}
                sx={{ width: 96, height: 96, border: '4px solid white', bgcolor: 'grey.300' }}
              >
                {!avatar && <PersonIcon sx={{ fontSize: 48 }} />}
              </Avatar>
              <IconButton
                size="small"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 28,
                  height: 28,
                }}
              >
                {uploadingAvatar ? <CircularProgress size={14} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 16 }} />}
              </IconButton>
              {avatar && (
                <IconButton
                  size="small"
                  onClick={() => handleImageDelete('avatar')}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                    width: 24,
                    height: 24,
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={handleFileChange('avatar')}
            />
          </Box>
        </Box>

        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 8 }}>
          <TextField
            label={translate('psyched.profile.username', { _: 'Username' })}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ maxWidth: 400 }}
          />

          <TextField
            label={translate('psyched.profile.email', { _: 'Email' })}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            sx={{ maxWidth: 400 }}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {translate('psyched.settings.ui_language', { _: 'Language' })}
            </Typography>
            <ToggleButtonGroup
              value={selectedLocale}
              exclusive
              onChange={(_, value) => {
                if (value) setSelectedLocale(value);
              }}
              size="small"
            >
              {supportedLocales.map((loc) => (
                <ToggleButton
                  key={loc}
                  value={loc}
                  sx={{ textTransform: 'uppercase', px: 3 }}
                >
                  {loc}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {translate('psyched.profile.roles', { _: 'Roles' })}
            </Typography>
            <Stack direction="row" spacing={1}>
              {(Array.isArray(permissions) ? permissions : roles).map((role: string) => (
                <Chip key={role} label={translate(`psyched.roles.${role}`, { _: role })} size="small" variant="outlined" />
              ))}
            </Stack>
          </Box>

          <Box>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {translate('psyched.settings.save', { _: 'Save' })}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
