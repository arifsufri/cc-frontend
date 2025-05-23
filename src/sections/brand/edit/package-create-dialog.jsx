import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Button,
  MenuItem,
  FormLabel,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import useGetPackages from 'src/hooks/use-get-packges';
import useGetClientHistory from 'src/hooks/use-get-package-history';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFSelect, RHFTextField, RHFDatePicker } from 'src/components/hook-form';

const packageSchema = Yup.object().shape({
  packageId: Yup.string().required('Package Name is required'),
  packageType: Yup.string().required('Package Type is required'),
  totalUGCCredits: Yup.number().required('Total UGC Credits is required'),
  validityPeriod: Yup.number().required('Validity Period is required'),
  invoiceDate: Yup.string().required('Invoice Date is required'),
});

const defaultValues = {
  packageId: '',
  packageType: '',
  packageValue: '',
  totalUGCCredits: '',
  validityPeriod: '',
  currency: '',
  invoiceDate: null,
};

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children, ...others }) => (
  <Stack spacing={1}>
    <FormLabel required sx={{ fontWeight: 600, color: 'black' }} {...others}>
      {label}
    </FormLabel>
    {children}
  </Stack>
);

const PackageCreateDialog = ({ packageDialog, companyId }) => {
  const methods = useForm({
    resolver: yupResolver(packageSchema),
    defaultValues,
  });

  const { mutate } = useGetClientHistory(companyId);

  const { data: packages, isLoading } = useGetPackages();

  const {
    handleSubmit,
    formState: { isSubmitting },
    watch,
    setValue,
  } = methods;

  const packageType = watch('packageType');
  const currency = watch('currency');
  const invoiceDate = watch('invoiceDate');
  const validitiyPeriod = watch('validityPeriod');

  const onSubmit = handleSubmit(async (data) => {
    const currentPackage = packages.find((c) => c.type === packageType);

    try {
      const response = await axiosInstance.patch(endpoints.company.linkPackage(companyId), {
        ...data,
        packageId: currentPackage.id,
      });
      mutate();
      packageDialog.onFalse();
      enqueueSnackbar(response?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message || 'Error submitting ', { variant: 'error' });
    }
  });

  useEffect(() => {
    if (packageType && currency) {
      const item = packages.find((c) => c.type === packageType);
      if (packageType !== 'Custom') {
        setValue('packageId', item.packageId);
        setValue('validityPeriod', item.validityPeriod);
        setValue('packageType', item.type);
        setValue('packageValue', currency === 'MYR' ? item.valueMYR : item.valueSGD);
        setValue('totalUGCCredits', item.totalUGCCredits);
      } else {
        setValue('packageId', 'Autogenerated');
        setValue('validityPeriod', '');
        setValue('packageType', item.type);
        setValue('packageValue', '');
        setValue('packageTotalCredits', '');
      }
    }
  }, [setValue, packageType, currency, packages]);

  if (isLoading) {
    return (
      <Box
        sx={{
          position: 'relative',
          top: 200,
          textAlign: 'center',
        }}
      >
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: (theme) => theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  return (
    <Dialog
      open={packageDialog.value}
      onClose={packageDialog.onFalse}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 0.8,
          scrollbarWidth: 'thin',
          scrollbarColor: '#EEEEEE #FFF ',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="bx:package" width={30} />
          <Typography
            variant="h3"
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              letterSpacing: 0.8,
            }}
          >
            Create Package
          </Typography>
        </Stack>
      </DialogTitle>

      <FormProvider onSubmit={onSubmit} methods={methods}>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1,1fr)', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <FormField required={false} label="Package Type">
              <RHFSelect name="packageType">
                <MenuItem disabled sx={{ fontStyle: 'italic' }}>
                  Select package type
                </MenuItem>
                {['Trail', 'Basic', 'Essential', 'Pro', 'Custom'].map((e) => (
                  <MenuItem key={e} value={e}>
                    {e}
                  </MenuItem>
                ))}
              </RHFSelect>
            </FormField>

            <FormField required={false} label="Currency">
              <RHFSelect name="currency">
                <MenuItem disabled sx={{ fontStyle: 'italic' }}>
                  Select currency
                </MenuItem>
                {['MYR', 'SGD'].map((e) => (
                  <MenuItem key={e} value={e}>
                    {e}
                  </MenuItem>
                ))}
              </RHFSelect>
            </FormField>

            {packageType && currency && (
              <>
                <FormField required={false} label="Package ID">
                  <RHFTextField name="packageId" disabled />
                </FormField>
                <FormField required={false} label="Package Value">
                  <RHFTextField
                    name="packageValue"
                    disabled={packageType !== 'Custom'}
                    placeholder="Package Value"
                    type={packageType === 'Custom' ? 'number' : ''}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </FormField>
                <FormField required={false} label="Total UGC Credits">
                  <RHFTextField
                    name="totalUGCCredits"
                    disabled={packageType !== 'Custom'}
                    placeholder="Total UGC Credits"
                    type={packageType === 'Custom' ? 'number' : ''}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </FormField>

                <FormField required={false} label="Validity Period">
                  <RHFTextField
                    name="validityPeriod"
                    disabled={packageType !== 'Custom'}
                    placeholder="Validity Period"
                    type={packageType === 'Custom' ? 'number' : ''}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    InputProps={{ inputProps: { min: 1 } }}
                    helperText={
                      invoiceDate
                        ? `Valid until ${dayjs(invoiceDate)
                            .add(validitiyPeriod, 'month')
                            .format('LL')}`
                        : ''
                    }
                  />
                </FormField>

                <FormField label="Invoice Date">
                  <RHFDatePicker name="invoiceDate" />
                </FormField>
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={packageDialog.onClose} variant="outlined" sx={{ borderRadius: 0.8 }}>
            Close
          </Button>
          <LoadingButton
            variant="contained"
            sx={{ borderRadius: 0.8 }}
            type="submit"
            loading={isSubmitting}
          >
            Create
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default PackageCreateDialog;

PackageCreateDialog.propTypes = {
  packageDialog: PropTypes.object,
  companyId: PropTypes.string,
};
