import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// const domainWithSubdomainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/;

export const useNewNote = () => {
  const domainSchema = z.object({
    domain: z
      .string()
      .min(4, {
        message: 'Minimum 4 chars.',
      })
      .email(),
  });

  const inputFrom = useForm<z.infer<typeof domainSchema>>({
    resolver: zodResolver(domainSchema),
    defaultValues: { domain: '' },
  });

  return {
    inputFrom,
  };
};
