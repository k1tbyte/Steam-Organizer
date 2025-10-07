import React, {type FC} from "react";
import {ECredentialType, IAccountCredential, serviceNames} from "@/types/accountCredentials";
import {ModalSeparator, useModalActions} from "@/shared/ui/Modal";
import {FieldWrapper} from "@/components/FieldWrapper";
import {Icon, SvgIcon} from "@/defines";
import Input from "@/shared/ui/Input";
import {ComboBox} from "@/shared/ui/ComboBox/ComboBox";
import Button, {EButtonVariant} from "@/shared/ui/Button";
import {credentialFieldNames} from "./types";
import {CredentialField} from "./CredentialField";

export const NewCredentialModal: FC<{onAdd: (value: IAccountCredential) => void}> = ({ onAdd }) => {
    const [fields, setFields] = React.useState<ECredentialType[]>([]);
    const items = credentialFieldNames.filter((_,i) => !fields.includes(i))
    const objRef = React.useRef<IAccountCredential>({f: {}});
    const { contentRef, closeModal } = useModalActions<HTMLDivElement>();

    return (
        <div ref={contentRef} style={{ width: "270px"}}>
            <FieldWrapper className="mb-3" title="Display name"
                          icon={<SvgIcon icon={Icon.InfoCircleOutline} size={20}/>}>
                <Input placeholder="Leave blank to use default"
                       maxLength={20}
                       bindTo={objRef.current}
                       bindKey={nameof(objRef.current.n)}/>
            </FieldWrapper>
            <ComboBox allowClear placeholder="External link type (Other)"
                      items={Object.entries(serviceNames).map(([k, v], i) => {
                          return <div key={i} className="flex-y-center gap-3">
                              <SvgIcon icon={Number(k)} size={20}/>
                              {v}
                          </div>
                      })}
                      onSelected={o => {
                          objRef.current.i = o
                      }}
            />
            <ModalSeparator className="my-4"/>
            {
                fields.map((f, i) => {
                    return <div className="flex items-center" key={i}>
                        <CredentialField readOnly
                                          validator={null}
                                          className="pointer-events-none"
                                          type={f}/>
                        <Button variant={EButtonVariant.Outlined}
                                onClick={() => {
                                    setFields(prev => prev.filter((_, j) => j !== i))
                                }}
                                className="py-1 px-2 mt-4 ml-4">
                            —
                        </Button>
                    </div>
                })
            }
            {
                items.length > 0 &&
                <ComboBox placeholder="Select type of credential"
                          className="mt-3"
                          items={items}
                          onSelected={(i) => {
                              setFields(prev =>
                                  [...prev, credentialFieldNames.indexOf(items[i])]
                              );
                              return true
                          }}/>
            }

            {
                fields.length > 0 &&
                <Button className="mt-5 mx-auto" children="Submit" onClick={() => {
                    objRef.current.f = fields.reduce((acc, index) => {
                        acc[index.toString()] = "";
                        return acc;
                    }, {} as Record<ECredentialType, string>)

                    if(objRef.current.n === "") {
                        delete objRef.current.n;
                    }

                    if(objRef.current.i >= 0) {
                        objRef.current.i = Number(Object.keys(serviceNames)[objRef.current.i]);
                    } else {
                        delete objRef.current.i;
                    }

                    onAdd(objRef.current);
                    closeModal()
                }}/>
            }
        </div>
    )
}