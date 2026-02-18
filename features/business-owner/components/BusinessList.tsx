"use client";

import React, { useState } from "react";
import { Building2, Eye, Briefcase, Calendar, Users, Mail, Phone, MapPin } from "lucide-react";
import { Card, Modal, Badge, PageLoader } from "@/components";
import { Button } from "@/components/buttons";
import { EmptyState } from "@/components/layout";
import { useGetMyBusinesses } from "../hooks";
import { Business } from "@/types";
import { AddOwnerForm } from "./AddOwnerForm";
import { BusinessOwnersList } from "./BusinessOwnersList";
import { BookingsAndContacts } from "./BookingsAndContacts";

export const BusinessList: React.FC = () => {
  const { businesses, isLoading } = useGetMyBusinesses();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  if (isLoading) {
    return <PageLoader />;
  }

  if (businesses.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-12 w-12 text-gray-400" />}
        title="No businesses yet"
        description="Create your first business to get started and unlock all features!"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {businesses.map((business: Business) => (
        <Card 
          key={business.id} 
          padding="none"
          className="overflow-hidden hover:shadow-lg transition-all"
        >
          {/* Business Image/Logo */}
          {business.logoUrl ? (
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Building2 className="w-20 h-20 text-white/60" />
            </div>
          )}
          
          {/* Business Info */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {business.name}
              </h3>
              <Badge variant="secondary" className="text-xs font-medium">
                @{business.slug}
              </Badge>
            </div>
            
            {business.description && (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {business.description}
              </p>
            )}
            
            {/* Contact Info */}
            <div className="space-y-3 pb-6 border-b border-border">
              {business.email && (
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="truncate">{business.email}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.address && (
                <div className="flex items-start gap-3 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{business.address}</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="default"
                  className="w-full"
                  asChild
                >
                  <a
                    href={`/business/slug/${business.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </a>
                </Button>
                
                <Button
                  variant="default"
                  className="w-full"
                  asChild
                >
                  <a href={`/business-owner/${business.id}/services`}>
                    <Briefcase className="w-4 h-4" />
                    Services
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Modal>
                  <Modal.Open opens={`view-bookings-${business.id}`}>
                    <Button variant="outline" className="w-full">
                      <Calendar className="w-4 h-4" />
                      Bookings
                    </Button>
                  </Modal.Open>
                  <Modal.Body
                    name={`view-bookings-${business.id}`}
                    className="w-full max-w-6xl p-8"
                  >
                    <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                      Bookings & Contacts - {business.name}
                    </h2>
                    <BookingsAndContacts businessId={business.id} />
                    <Modal.Close>
                      <Button variant="outline" className="mt-8 w-full" size="lg">
                        Close
                      </Button>
                    </Modal.Close>
                  </Modal.Body>
                </Modal>
                
                <Modal>
                  <Modal.Open opens={`manage-owners-${business.id}`}>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedBusiness(business)}
                    >
                      <Users className="w-4 h-4" />
                      Co-Owners
                    </Button>
                  </Modal.Open>
                  <Modal.Body
                    name={`manage-owners-${business.id}`}
                    className="w-full max-w-4xl p-8"
                  >
                    <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                      Manage Co-Owners - {business.name}
                    </h2>
                    
                    {/* Add Owner Section */}
                    <div className="mb-10">
                      <h3 className="text-xl font-medium text-gray-900 mb-6">
                        Add Co-Owner
                      </h3>
                      <AddOwnerForm businessId={business.id} />
                    </div>
                    
                    {/* Current Owners Section */}
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 mb-6">
                        Current Owners
                      </h3>
                      <BusinessOwnersList businessId={business.id} />
                    </div>

                    <Modal.Close>
                      <Button variant="outline" className="mt-8 w-full" size="lg">
                        Close
                      </Button>
                    </Modal.Close>
                  </Modal.Body>
                </Modal>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
