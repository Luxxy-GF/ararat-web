"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/app/_components/ui/field";
import { Input } from "@/app/_components/ui/input";
import { useProfiles } from "@/app/(main)/profiles/_hooks/profiles";
import { useEffect } from "react";

export default function InstanceProperties() {
  const { data } = useProfiles();
  useEffect(() => {
    console.log(data);
  });
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" />
        <FieldError>Name error</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Input id="description" />
        <FieldError>Description error</FieldError>
      </Field>
    </FieldGroup>
  );
}
