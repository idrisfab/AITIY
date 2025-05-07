import { useState, type ChangeEvent } from 'react';
import { ChromePicker, ColorResult } from 'react-color';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '@/stores/themeStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import type { ThemeConfig, ColorScheme } from '@/types/theme';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div
        className="w-full h-10 rounded-md cursor-pointer border border-gray-200 dark:border-gray-700"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="absolute z-10 mt-2">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />
          <ChromePicker
            color={color}
            onChange={(color: ColorResult) => onChange(color.hex)}
          />
        </div>
      )}
    </div>
  );
};

export const ThemeCustomizer: React.FC = () => {
  const { theme, isPremium, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'light' | 'dark'>('light');

  if (!isPremium) {
    return (
      <div className="p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Premium Feature
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Upgrade to Premium to access advanced theme customization options.
        </p>
        <Button
          onClick={() => window.open('/pricing', '_blank')}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
        >
          Upgrade to Premium
        </Button>
      </div>
    );
  }

  const handleColorChange = (key: keyof ColorScheme, color: string) => {
    setTheme({
      colors: {
        ...theme.colors,
        [activeTab]: {
          ...theme.colors[activeTab],
          [key]: color,
        },
      },
    });
  };

  const handleFontChange = (type: 'heading' | 'body', key: keyof typeof theme.fonts.heading, value: string | number) => {
    setTheme({
      fonts: {
        ...theme.fonts,
        [type]: {
          ...theme.fonts[type],
          [key]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        <Button
          variant={activeTab === 'light' ? 'default' : 'outline'}
          onClick={() => setActiveTab('light')}
        >
          Light Mode
        </Button>
        <Button
          variant={activeTab === 'dark' ? 'default' : 'outline'}
          onClick={() => setActiveTab('dark')}
        >
          Dark Mode
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Colors
          </h3>
          <div className="space-y-4">
            <ColorPicker
              label="Primary Color"
              color={theme.colors[activeTab].primary}
              onChange={(color) => handleColorChange('primary', color)}
            />
            <ColorPicker
              label="Secondary Color"
              color={theme.colors[activeTab].secondary}
              onChange={(color) => handleColorChange('secondary', color)}
            />
            <ColorPicker
              label="Accent Color"
              color={theme.colors[activeTab].accent}
              onChange={(color) => handleColorChange('accent', color)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Typography
          </h3>
          <div className="space-y-4">
            <Input
              label="Heading Font"
              type="text"
              value={theme.fonts.heading.family}
              onChange={(e) => handleFontChange('heading', 'family', e.target.value)}
              placeholder="Inter"
            />
            <Input
              label="Body Font"
              type="text"
              value={theme.fonts.body.family}
              onChange={(e) => handleFontChange('body', 'family', e.target.value)}
              placeholder="Inter"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Branding
        </h3>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show "Powered by" Badge
          </label>
          <Switch
            checked={theme.branding.showPoweredBy}
            onCheckedChange={(checked: boolean) =>
              setTheme({
                branding: {
                  ...theme.branding,
                  showPoweredBy: checked,
                },
              })
            }
          />
        </div>
        <Input
          label="Custom Logo URL"
          type="text"
          value={theme.branding.logo || ''}
          onChange={(e) =>
            setTheme({
              branding: {
                ...theme.branding,
                logo: e.target.value,
              },
            })
          }
          placeholder="https://your-domain.com/logo.png"
        />
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          value={theme.branding.customCss || ''}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setTheme({
              branding: {
                ...theme.branding,
                customCss: e.target.value,
              },
            })
          }
          placeholder="Add custom CSS rules"
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => useThemeStore.getState().resetTheme()}
        >
          Reset to Default
        </Button>
        <Button
          onClick={() => {
            // TODO: Save theme to backend
            toast.success('Theme settings saved successfully');
          }}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}; 