"use client";

import * as React from "react";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/app/_components/ui/field";
import { Input } from "@/app/_components/ui/input";
import { useProfiles } from "@/app/(main)/_hooks/profiles";

import {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxItem,
} from "@/app/_components/ui/combobox";

export default function InstanceProperties({
  profilesSelected,
  setProfilesSelected,
}: {
  profilesSelected: string[];
  setProfilesSelected: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const {
    data: profiles,
    isLoading: isLoadingProfiles,
    isValidating: isValidatingProfiles,
  } = useProfiles();
  return (
    <div className="flex flex-col gap-2">
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" />
      </Field>
      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Input id="description" />
      </Field>
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
              <ComboboxItem
                key={p.name}
                value={p.name}
                description={p.description}
              >
                {p.name}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
      </Field>
    </div>
  );
}
