/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React from 'react';
import { Properties } from '../constants';
import { Utils } from '../utils/Utils';
import { AuthoringUtils, ModelManager } from '@adobe/aem-spa-page-model-manager';
import { ModelProps } from '../types/AEMModel';
import { Config, MappedComponentProperties } from '../types/EditConfig';
import { useEditor } from '../hooks/useEditor';
import Placeholder from '../components/Placeholder';

export type EditableComponentProps = {
  config?: Config<MappedComponentProperties>;
  children?: React.ReactNode;
  className?: string;
  appliedCssClassNames?: string;
  containerProps?: { className?: string };
  model?: ModelProps;
  pagePath?: string;
  itemPath?: string;
  removeDefaultStyles?: boolean;
} & MappedComponentProperties;

const addPropsToComponent = (component: React.ReactNode, props: MappedComponentProperties) => {
  if (React.isValidElement(component)) {
    return React.cloneElement(component, props);
  }
  return component;
};

export const EditableComponent = (editableProps: EditableComponentProps): JSX.Element => {
  const {
    config = { isEmpty: () => false },
    children,
    model: userModel,
    cqPath,
    pagePath,
    itemPath,
    isInEditor = AuthoringUtils.isInEditor(),
    className = '',
    ...props
  } = editableProps;
  const { updateModel } = useEditor();
  const { forceReload, resourceType = '' } = config || {};
  const path = cqPath || Utils.getCQPath({ cqPath, pagePath, itemPath });
  const [model, setModel] = React.useState(() => userModel || {});

  React.useEffect(() => {
    setModel(userModel ?? {});
  }, [path, userModel]);

  React.useEffect(() => {
    const renderContent = () => updateModel({ path, forceReload, setModel, isInEditor, pagePath });
    !Object.keys(model)?.length && renderContent();
    ModelManager.addListener(path, renderContent);
    return () => {
      ModelManager.removeListener(path, renderContent);
    };
  }, [path, model, updateModel, isInEditor, pagePath, forceReload]);

  if (!editableProps) return <></>;

  const componentProps = {
    cqPath: path,
    ...model,
  };

  const dataAttr =
    (isInEditor && {
      [Properties.DATA_PATH_ATTR]: path,
      [Properties.DATA_CQ_RESOURCE_TYPE_ATTR]: resourceType,
    }) ||
    {};

  const { appliedCssClassNames = '' } = model;
  const componentClassName = `${className} ${props.containerProps?.className || ''} ${appliedCssClassNames}`.trim();
  const updatedComponent = addPropsToComponent(children, pagePath ? componentProps : model);
  return isInEditor || (!props.removeDefaultStyles && componentClassName) ? (
    <div className={componentClassName} {...dataAttr}>
      {updatedComponent}
      {isInEditor && <Placeholder config={config} {...componentProps} />}
    </div>
  ) : (
    <>{updatedComponent}</>
  );
};
