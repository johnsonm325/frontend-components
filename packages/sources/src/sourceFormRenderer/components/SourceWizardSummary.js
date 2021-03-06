import React from 'react';
import PropTypes from 'prop-types';
import { TextContent, TextListItem, TextListItemVariants, TextListVariants, TextList } from '@patternfly/react-core';
import flattenDeep from 'lodash/flattenDeep';

export const createItem = (value, fields, path) => {
    const formField = fields.find((field) => field.name === path);
    // not in field, probably source_name or type, handled seperately
    if (!formField) {
        return undefined;
    }

    // do not show hidden fields
    if (formField.hideField) {
        return undefined;
    }

    // Hide password
    if (formField.type === 'password') {
        value = '●●●●●●●●●●●●';
    }

    // Boolean value convert to Yes / No
    if (typeof value === 'boolean') {
        value = value ? 'Yes' : 'No';
    }

    return ({ label: formField.label,  value });
};

export const allValuesPath = (value, fields, path = undefined) => {
    if (typeof value !== 'object') {
        return createItem(value, fields, path);
    }

    return Object.keys(value).map((key) => allValuesPath(value[key], fields, path ? `${path}.${key}` : key)).filter(x => x);
};

const SourceWizardSummary = ({ sourceTypes, formOptions, applicationTypes, showApp, showAuthType }) => {
    const values = formOptions.getState().values;
    const type = sourceTypes.find(type => type.name === values.source_type);

    const authType = type.schema.authentication.find(({ type }) => type === values.authentication.authtype);

    let additionalFields = [];
    if (authType.additional_steps) {
        additionalFields = flattenDeep(authType.additional_steps.map(({ fields }) => fields));
    }

    const authTypeFields = authType.fields;
    const endpointFields = type.schema.endpoint.fields;

    const fields = [ ...authTypeFields, ...endpointFields, ...additionalFields  ];

    const application = values.application ? applicationTypes.find(type => type.id === values.application.application_type_id) : undefined;
    const applicationName = application ? application.display_name : 'Not selected';

    const valuesInfo = [ ...flattenDeep(allValuesPath(values, fields)) ].filter(x => x);

    const valuesList = valuesInfo.map(({ label, value }) => (
        <React.Fragment key={ `${label}--${value}` }>
            <TextListItem component={ TextListItemVariants.dt }>{ label }</TextListItem>
            <TextListItem component={ TextListItemVariants.dd }>{ value }</TextListItem>
        </React.Fragment>
    ));

    return (
        <TextContent>
            <TextList component={ TextListVariants.dl }>
                <TextListItem component={ TextListItemVariants.dt }>{ 'Name' }</TextListItem>
                <TextListItem component={ TextListItemVariants.dd }>{ values.source.name }</TextListItem>
                { showApp && <React.Fragment>
                    <TextListItem component={ TextListItemVariants.dt }>{ 'Application' }</TextListItem>
                    <TextListItem component={ TextListItemVariants.dd }>{ applicationName }</TextListItem>
                </React.Fragment> }
                { showAuthType && <React.Fragment>
                    <TextListItem component={ TextListItemVariants.dt }>{ 'Authentication type' }</TextListItem>
                    <TextListItem component={ TextListItemVariants.dd }>{ authType.name }</TextListItem>
                </React.Fragment> }
                <TextListItem component={ TextListItemVariants.dt }>{ 'Source Type' }</TextListItem>
                <TextListItem component={ TextListItemVariants.dd }>{ type.product_name }</TextListItem>
                { valuesList }
            </TextList>
        </TextContent>
    );
};

SourceWizardSummary.propTypes = {
    formOptions: PropTypes.any.isRequired,
    sourceTypes: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        product_name: PropTypes.string.isRequired,
        schema: PropTypes.shape({
            authentication: PropTypes.array,
            endpoint: PropTypes.object
        })
    })).isRequired,
    applicationTypes: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        display_name: PropTypes.string.isRequired
    })).isRequired,
    showApp: PropTypes.bool,
    showAuthType: PropTypes.bool
};

SourceWizardSummary.defaultProps = {
    showApp: true,
    showAuthType: true
};

export default SourceWizardSummary;
