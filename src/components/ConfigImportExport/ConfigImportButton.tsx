import React, { useRef } from 'react';
import { Button } from '../ui';
import { configImportSchema } from '../../schemas/account';
import { useToast } from '../../hooks/useToast';

interface ConfigImportButtonProps {
  onImport: (config: { accounts: any[]; masterText?: string }) => void;
}

export const ConfigImportButton: React.FC<ConfigImportButtonProps> = ({
  onImport,
}) => {
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
        toast.error('配置文件格式不正确');
        console.error('Validation errors:', result.error);
        return;
      }

      onImport(result.data);
      toast.success('配置导入成功');
    } catch (error) {
      toast.error('配置文件解析失败');
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
        aria-label="Import configuration file"
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClick}
        aria-label="Import configuration from JSON file"
      >
        导入配置
      </Button>
    </>
  );
};
