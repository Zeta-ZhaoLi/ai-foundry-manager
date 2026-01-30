import React, { useRef } from 'react';
import { Button } from '../ui';
import { configImportSchema } from '../../schemas/account';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';

interface ConfigImportButtonProps {
  onImport: (config: { accounts: any[]; masterText?: string }) => void;
}

export const ConfigImportButton: React.FC<ConfigImportButtonProps> = ({
  onImport,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // 验证配置格式
      const result = configImportSchema.safeParse(json);

      if (!result.success) {
        toast.error(t('toast.invalidConfig'));
        console.error('Validation errors:', result.error);
        return;
      }

      onImport(result.data);
      toast.success(t('toast.configImported'));
    } catch (error) {
      toast.error(t('toast.configImportFailed'));
      console.error('Import error:', error);
    } finally {
      // 重置 input，允许重复导入同一个文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        aria-label={t('accounts.importConfig')}
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClick}
        aria-label={t('accounts.importConfig')}
      >
        {t('accounts.importConfig')}
      </Button>
    </>
  );
};
