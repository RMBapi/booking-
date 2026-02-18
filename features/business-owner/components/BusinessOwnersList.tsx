"use client";

import React, { useState } from "react";
import { Card, Button, Modal } from "@/components";
import { useGetBusinessOwners, useRemoveBusinessOwner } from "../hooks";
import { useAuth } from "@/contexts";
import { BusinessOwner } from "@/types";

interface BusinessOwnersListProps {
  businessId: string;
}

export const BusinessOwnersList: React.FC<BusinessOwnersListProps> = ({
  businessId,
}) => {
  const { owners, isLoading, refetch } = useGetBusinessOwners(businessId);
  const { removeBusinessOwner, isRemoving } = useRemoveBusinessOwner();
  const { user } = useAuth();
  const [ownerToRemove, setOwnerToRemove] = useState<BusinessOwner | null>(null);

  const handleRemoveOwner = () => {
    if (!ownerToRemove) return;

    removeBusinessOwner(businessId, ownerToRemove.id, {
      onSuccess: () => {
        setOwnerToRemove(null);
        refetch();
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading owners...</p>
        </div>
      </Card>
    );
  }

  if (owners.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-600">No owners found</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {owners.map((owner) => (
                <tr key={owner.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {owner.firstName} {owner.lastName}
                      {owner.id === user?.id && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{owner.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{owner.phone || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(owner.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {owner.id !== user?.id && owners.length > 1 && (
                      <Modal>
                        <Modal.Open opens={`remove-${owner.id}`}>
                          <button className="text-red-600 hover:text-red-900">
                            Remove
                          </button>
                        </Modal.Open>
                        <Modal.Body name={`remove-${owner.id}`} className="w-full max-w-md p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Remove Co-Owner
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Are you sure you want to remove{" "}
                            <strong>
                              {owner.firstName} {owner.lastName}
                            </strong>{" "}
                            as a co-owner? They will no longer have access to manage this
                            business.
                          </p>
                          <div className="flex gap-3">
                            <Modal.Close>
                              <Button variant="secondary" className="flex-1">
                                Cancel
                              </Button>
                            </Modal.Close>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => {
                                setOwnerToRemove(owner);
                                handleRemoveOwner();
                              }}
                              isLoading={isRemoving && ownerToRemove?.id === owner.id}
                            >
                              Remove
                            </Button>
                          </div>
                        </Modal.Body>
                      </Modal>
                    )}
                    {owner.id === user?.id && (
                      <span className="text-gray-400">Current User</span>
                    )}
                    {owner.id !== user?.id && owners.length === 1 && (
                      <span
                        className="text-gray-400"
                        title="Cannot remove the last owner"
                      >
                        Last Owner
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {owners.length === 1 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> You are the only owner of this business. You cannot
            remove yourself. Add another co-owner first if you want to transfer
            ownership.
          </p>
        </div>
      )}
    </>
  );
};
