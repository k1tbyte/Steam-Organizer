import React, {FC} from "react";
import { InputValidationWrapper } from "@/components/FieldWrapper";
import {Icon, SvgIcon} from "src/defines";
import {PasswordBox} from "@/shared/ui/PasswordBox";
import Button from "@/shared/ui/Button";
import {InfoNote} from "@/pages/Modals/elements/InfoNote";
import {jsonIgnoreNull} from "@/shared/lib/utils";
import {deriveKey, encrypt } from "@/shared/services/cryptography";
import {useModalActions} from "@/shared/ui/Modal";
import {validators} from "@/shared/hooks/useFormValidation";

interface IExportDataProps {
    getData: () => [string, Object]
    extension?: string;
    encryptedExtension?: string
}

export const ExportData:FC<IExportDataProps> = ({ getData, extension, encryptedExtension }) => {
    const { closeModal, contentRef } = useModalActions<HTMLFormElement>()

    return <form ref={contentRef} style={{ maxWidth: "290px" }} onSubmit={async (e) => {
        e.preventDefault()
        const key = (new FormData(e.currentTarget)).get("key") as string | null;
        const [name, data] = getData();
        const json = JSON.stringify(data, jsonIgnoreNull, key ? undefined : 2);
        const object = key ? await encrypt(await deriveKey({ secret: key }), json) : json;

        const blob = new Blob([object], { type: key ? "application/octet-stream" : 'application/json' });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}.${key ? encryptedExtension ?? "bin" : extension ?? "json"}`;
        link.click();
        URL.revokeObjectURL(url);
        closeModal();
    }}>
        <InfoNote title={"Enter a password to encrypt the exported data. Leave the input field blank to export without encryption"}/>
        <InputValidationWrapper title="Encryption key" icon={<SvgIcon icon={Icon.Key} size={20}/>}>
            <PasswordBox validator={i => i && validators.password(i)} name="key" placeholder="Optional (recommended)"/>
        </InputValidationWrapper>
        <Button className="mx-auto mt-5">Export</Button>
    </form>
}