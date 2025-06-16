
"use client";

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile, type UpdateUserProfilePayload } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArrowLeft, Save, Phone, Home, Building } from 'lucide-react';
import type { ShippingAddress } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

// Zod Schema
const addressSchemaInternal = z.object({
  street: z.string().min(1, "Street is required").max(100, "Street too long"),
  city: z.string().min(1, "City is required").max(50, "City too long"),
  state: z.string().min(1, "State is required").max(50, "State too long"),
  country: z.string().min(1, "Country is required").max(50, "Country too long"),
  zipCode: z.string().min(1, "Zip code is required").max(20, "Zip code too long"),
});

// Make the entire address object optional for the form, but if provided, all fields are required.
const optionalAddressSchema = addressSchemaInternal.optional().or(z.literal(null)).or(z.literal(undefined));


const profileFormSchema = z.object({
  phone: z.string().optional().or(z.literal('')) // Allow empty string, specific regex can be added if needed
           .refine(val => val === '' || val === undefined || /^\+?[1-9]\d{1,14}$/.test(val), {
             message: "Invalid phone number format (e.g., +1234567890)",
           }),
  shippingAddress: optionalAddressSchema,
  billingAddress: optionalAddressSchema,
  isBillingSameAsShipping: z.boolean().optional(),
}).refine(data => {
    // If any shipping address field is filled, all must be filled
    if (data.shippingAddress && Object.values(data.shippingAddress).some(val => val && val.trim() !== '')) {
        return addressSchemaInternal.safeParse(data.shippingAddress).success;
    }
    return true;
  }, {
    message: "All shipping address fields must be completed if shipping address is partially filled.",
    path: ["shippingAddress"],
  })
  .refine(data => {
    // If billing is not same as shipping AND any billing address field is filled, all must be filled
    if (!data.isBillingSameAsShipping && data.billingAddress && Object.values(data.billingAddress).some(val => val && val.trim() !== '')) {
        return addressSchemaInternal.safeParse(data.billingAddress).success;
    }
    return true;
  }, {
    message: "All billing address fields must be completed if billing address is partially filled and not same as shipping.",
    path: ["billingAddress"],
  });


type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
  const { user, updateUserProfileContext, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultAddress: ShippingAddress = { street: '', city: '', state: '', country: '', zipCode: '' };

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      phone: '',
      shippingAddress: defaultAddress,
      billingAddress: defaultAddress,
      isBillingSameAsShipping: true, // Default to true for convenience
    }
  });

  const isBillingSame = watch('isBillingSameAsShipping');
  const shippingAddressValues = watch('shippingAddress');

  useEffect(() => {
    if (user) {
      const initialShipping = user.shippingAddress || defaultAddress;
      const initialBilling = user.billingAddress || defaultAddress;

      let billingSame = true; // Assume true initially
      if (user.shippingAddress && user.billingAddress) {
          billingSame = Object.keys(initialShipping).every(
            (key) => initialShipping[key as keyof ShippingAddress] === initialBilling[key as keyof ShippingAddress]
          );
      } else if (user.shippingAddress && !user.billingAddress) {
         // If only shipping exists, assume billing is same for UI convenience
         billingSame = true;
      } else if (!user.shippingAddress && user.billingAddress) {
        // If only billing exists, not same (edge case, form defaults to empty shipping)
        billingSame = false;
      } else { // Neither exists
        billingSame = true; // Default UI state
      }


      reset({
        phone: user.phone || '',
        shippingAddress: initialShipping,
        billingAddress: billingSame ? initialShipping : initialBilling,
        isBillingSameAsShipping: billingSame,
      });
    }
  }, [user, reset]);

  useEffect(() => {
    if (isBillingSame && shippingAddressValues) {
      setValue('billingAddress', { ...shippingAddressValues });
    } else if (!isBillingSame && user?.billingAddress) {
        // If unchecked and user had a distinct billing address, revert to it
        setValue('billingAddress', user.billingAddress);
    } else if (!isBillingSame) {
        // If unchecked and no distinct billing address, clear it (or set to defaultAddress)
        setValue('billingAddress', defaultAddress);
    }
  }, [isBillingSame, shippingAddressValues, setValue, user?.billingAddress]);


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const payload: UpdateUserProfilePayload = {
      phone: data.phone || undefined,
      shippingAddress: data.shippingAddress && Object.values(data.shippingAddress).some(val => val && val.trim() !== '') ? data.shippingAddress : undefined,
      billingAddress: data.isBillingSameAsShipping
        ? (data.shippingAddress && Object.values(data.shippingAddress).some(val => val && val.trim() !== '') ? data.shippingAddress : undefined)
        : (data.billingAddress && Object.values(data.billingAddress).some(val => val && val.trim() !== '') ? data.billingAddress : undefined),
    };

    // Ensure undefined is passed if an address object is empty strings
    if (payload.shippingAddress && !Object.values(payload.shippingAddress).some(s => s?.trim() !== '')) {
        payload.shippingAddress = undefined;
    }
    if (payload.billingAddress && !Object.values(payload.billingAddress).some(s => s?.trim() !== '')) {
        payload.billingAddress = undefined;
    }


    try {
      const updatedUser = await updateUserProfile(payload);
      updateUserProfileContext(updatedUser);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      router.push('/profile');
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAddressFields = (type: 'shippingAddress' | 'billingAddress', isDisabled: boolean = false) => {
    const prefix = type;
    const fieldErrors = errors[type];
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor={`${prefix}.street`}>Street</Label>
          <Input id={`${prefix}.street`} {...register(`${prefix}.street`)} placeholder="123 Main St" disabled={isDisabled} />
          {fieldErrors?.street && <p className="text-sm text-destructive mt-1">{fieldErrors.street.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}.city`}>City</Label>
            <Input id={`${prefix}.city`} {...register(`${prefix}.city`)} placeholder="Anytown" disabled={isDisabled} />
            {fieldErrors?.city && <p className="text-sm text-destructive mt-1">{fieldErrors.city.message}</p>}
          </div>
          <div>
            <Label htmlFor={`${prefix}.state`}>State / Province</Label>
            <Input id={`${prefix}.state`} {...register(`${prefix}.state`)} placeholder="CA" disabled={isDisabled} />
            {fieldErrors?.state && <p className="text-sm text-destructive mt-1">{fieldErrors.state.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}.zipCode`}>Zip / Postal Code</Label>
            <Input id={`${prefix}.zipCode`} {...register(`${prefix}.zipCode`)} placeholder="90210" disabled={isDisabled} />
            {fieldErrors?.zipCode && <p className="text-sm text-destructive mt-1">{fieldErrors.zipCode.message}</p>}
          </div>
          <div>
            <Label htmlFor={`${prefix}.country`}>Country</Label>
            <Input id={`${prefix}.country`} {...register(`${prefix}.country`)} placeholder="USA" disabled={isDisabled} />
            {fieldErrors?.country && <p className="text-sm text-destructive mt-1">{fieldErrors.country.message}</p>}
          </div>
        </div>
      </div>
    );
  };


  if (authLoading && !user) { // Show loading spinner if auth is loading and user is not yet available
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size={64} /></div>;
  }

  if (!user && !authLoading) { // Redirect if user is null after auth has finished loading (e.g. not logged in)
    router.push('/login?redirect=/profile/edit');
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size={64} /></div>; // Show spinner during redirect
  }


  return (
    <div className="container mx-auto py-8 max-w-2xl">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ArrowLeft size={16} className="mr-2" /> Back to Profile
        </Button>
      <Card className="shadow-lg rounded-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">Edit Profile</CardTitle>
          <CardDescription>Update your contact information and addresses.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="phone" className="flex items-center"><Phone size={16} className="mr-2 text-primary" />Phone Number</Label>
              <Input id="phone" type="tel" {...register('phone')} placeholder="+1 123-456-7890" />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center"><Home size={18} className="mr-2 text-primary"/>Shipping Address</h3>
              {renderAddressFields('shippingAddress')}
               {errors.shippingAddress && typeof errors.shippingAddress.message === 'string' && <p className="text-sm text-destructive mt-1">{errors.shippingAddress.message}</p>}
            </div>

            <Separator />

            <div>
                <div className="flex items-center space-x-2 mb-4">
                    <Controller
                        name="isBillingSameAsShipping"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                            id="isBillingSameAsShipping"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <Label htmlFor="isBillingSameAsShipping" className="cursor-pointer">
                        Billing address is the same as shipping address
                    </Label>
                </div>
              <h3 className="text-lg font-semibold mb-3 flex items-center"><Building size={18} className="mr-2 text-primary"/>Billing Address</h3>
              {renderAddressFields('billingAddress', false)}
              {errors.billingAddress && typeof errors.billingAddress.message === 'string' &&  <p className="text-sm text-destructive mt-1">{errors.billingAddress.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting ? <LoadingSpinner size={20} /> : <><Save size={18} className="mr-2"/> Save Changes</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    