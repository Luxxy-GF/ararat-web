'use client';

import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Field, FieldLabel } from '@/app/_components/ui/field';
import { Input } from '@/app/_components/ui/input';
import { useProfiles } from '@/app/(main)/_hooks/profiles';

import {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxItem,
} from '@/app/_components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/_components/ui/form';
import type { CreateInstanceBody } from '@/app/(main)/instances/_lib/instances.d';

interface InstancePropertiesProps {
  form: UseFormReturn<CreateInstanceBody>;
  profilesSelected: string[];
  setProfilesSelected: React.Dispatch<React.SetStateAction<string[]>>;
  instanceType: 'virtual-machine' | 'container';
  setInstanceType: React.Dispatch<React.SetStateAction<'virtual-machine' | 'container'>>;
}

export default function InstanceProperties({
  form,
  profilesSelected,
  setProfilesSelected,
  instanceType,
  setInstanceType,
}: InstancePropertiesProps) {
  const {
    data: profiles,
    isLoading: isLoadingProfiles,
    isValidating: isValidatingProfiles,
  } = useProfiles();
  return (
    <div className="flex flex-col gap-2">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input id="name" placeholder="my-instance" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Input
                id="description"
                placeholder="Optional description"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Field>
        <FieldLabel htmlFor="profile">Profiles</FieldLabel>
        <Combobox
          multiple
          values={profilesSelected}
          onValuesChange={setProfilesSelected}
          defaultValue="default"
          validating={isValidatingProfiles}
        >
          <ComboboxTrigger placeholder="Profiles" id="profile" />
          <ComboboxContent
            searchPlaceholder="Search profiles..."
            loading={isLoadingProfiles}
            emptyLabel="No profiles found."
          >
            {profiles?.map((p) => (
              <ComboboxItem key={p.name} value={p.name} description={p.description}>
                {p.name}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
      </Field>
      <Field>
        <FieldLabel htmlFor="type">Type</FieldLabel>
        <Select
          value={instanceType}
          onValueChange={(value) => setInstanceType(value as 'virtual-machine' | 'container')}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Select instance type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="container">Container</SelectItem>
            <SelectItem value="virtual-machine">Virtual Machine</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
