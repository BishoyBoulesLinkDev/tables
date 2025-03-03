import { useState } from 'react';
import { Table, Input } from 'antd';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { _ } from 'lodash';
import data from '../data/database.json';
import { DraggableBodyRow } from './DraggableBodyRow';

export default function Tables() {
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>(() => {
    const allHospitals = data.cities.flatMap((city) =>
      city.inistitutes.flatMap((institute) => institute.hospitals)
    );
    return allHospitals;
  });

  const [originalOrder, setOriginalOrder] = useState<string[]>(() => {
    const allHospitals = data.cities.flatMap((city) =>
      city.inistitutes.flatMap((institute) => institute.hospitals)
    );
    return allHospitals;
  });

  const [sortedInfo, setSortedInfo] = useState<{
    columnKey: string | null;
    order: 'ascend' | 'descend' | null;
  }>({
    columnKey: null,
    order: null,
  });

  const [manualOrder, setManualOrder] = useState<{ [key: string]: number }>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setSelectedHospitals((previous) => {
        const activeHospital = (active.id as string).replace('hospital-', '');
        const overHospital = (over?.id as string).replace('hospital-', '');

        const activeIndex = previous.indexOf(activeHospital);
        const overIndex = previous.indexOf(overHospital);
        setManualOrder((prev) => {
          const newOrder = { ...prev };
          newOrder[activeHospital] = overIndex + 1;
          return newOrder;
        });

        const newOrder = arrayMove(previous, activeIndex, overIndex);
        setOriginalOrder(newOrder);

        return newOrder;
      });
    }
  };

  const updateOrderNumbers = (
    hospital: string,
    newValue: number,
    currentManualOrder: { [key: string]: number }
  ) => {
    const newOrder = { ...currentManualOrder };

    Object.keys(newOrder).forEach((key) => {
      if (newOrder[key] === newValue) {
        delete newOrder[key];
      }
    });

    newOrder[hospital] = newValue;
    return newOrder;
  };

  const columns = [
    {
      title: 'الترتيب',
      dataIndex: 'sort',
      key: 'sort',
      width: '15%',
      sorter: (a: { hospital: string }, b: { hospital: string }) => {
        const getOrder = (record: { hospital: string }) => {
          return manualOrder[record.hospital] || originalOrder.indexOf(record.hospital) + 1;
        };
        return getOrder(a) - getOrder(b);
      },
      render: (_: unknown, record: { hospital: string }) => {
        const displayIndex =
          manualOrder[record.hospital] || originalOrder.indexOf(record.hospital) + 1;

        return (
          <Input
            type="number"
            min={1}
            max={selectedHospitals.length}
            value={displayIndex}
            placeholder="الترتيب"
            style={{ width: '60px' }}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              if (!isNaN(newValue) && newValue >= 1 && newValue <= selectedHospitals.length) {
                const newIndex = newValue - 1;
                const currentIndex = originalOrder.indexOf(record.hospital);

                setManualOrder((prev) => {
                  return updateOrderNumbers(record.hospital, newValue, prev);
                });

                const newArray = [...originalOrder];
                const [removed] = newArray.splice(currentIndex, 1);
                newArray.splice(newIndex, 0, removed);
                setOriginalOrder(newArray);
                setSelectedHospitals(newArray);
              }
            }}
          />
        );
      },
    },
    {
      title: 'المستشفى',
      dataIndex: 'hospital',
      key: 'hospital',
      width: '35%',
    },
    {
      title: 'الإدارة',
      dataIndex: 'institute',
      key: 'institute',
      width: '25%',
      sorter: (a: { hospital: string }, b: { hospital: string }) => {
        const getInstitute = (record: { hospital: string }) => {
          return (
            data.cities
              .flatMap((city) =>
                city.inistitutes.find((inst) => inst.hospitals.includes(record.hospital))
              )
              .filter(Boolean)[0]?.name || ''
          );
        };
        return getInstitute(a).localeCompare(getInstitute(b));
      },
      render: (_: unknown, record: { hospital: string }) => {
        const institute =
          data.cities
            .flatMap((city) =>
              city.inistitutes.find((inst) => inst.hospitals.includes(record.hospital))
            )
            .filter(Boolean)[0]?.name || '';
        return institute;
      },
    },
    {
      title: 'المديرية',
      dataIndex: 'city',
      key: 'city',
      width: '25%',
      sorter: (a: { hospital: string }, b: { hospital: string }) => {
        const getCity = (record: { hospital: string }) => {
          return (
            data.cities.find((city) =>
              city.inistitutes.some((inst) => inst.hospitals.includes(record.hospital))
            )?.name || ''
          );
        };
        return getCity(a).localeCompare(getCity(b));
      },
      render: (_: unknown, record: { hospital: string }) => {
        const city =
          data.cities.find((city) =>
            city.inistitutes.some((inst) => inst.hospitals.includes(record.hospital))
          )?.name || '';
        return city;
      },
    },
  ];

  return (
    <main className="table">
      <section>
        <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext items={selectedHospitals}>
            <Table
              components={{
                body: {
                  row: DraggableBodyRow,
                },
              }}
              dataSource={selectedHospitals.map((hospital) => ({
                hospital,
                key: hospital,
              }))}
              columns={columns}
              pagination={false}
              scroll={{ y: 400 }}
              onChange={(_, __, sorter) => {
                if (Array.isArray(sorter)) {
                  setSortedInfo({
                    columnKey: sorter[0]?.columnKey?.toString() || null,
                    order: sorter[0]?.order || null,
                  });
                  if (sorter[0]?.columnKey === 'sort') {
                    setSelectedHospitals((prev) =>
                      [...prev].sort((a, b) => {
                        const getOrder = (hospital: string) =>
                          manualOrder[hospital] || originalOrder.indexOf(hospital) + 1;
                        return sorter[0].order === 'ascend'
                          ? getOrder(a) - getOrder(b)
                          : getOrder(b) - getOrder(a);
                      })
                    );
                  }
                } else {
                  setSortedInfo({
                    columnKey: sorter.columnKey?.toString() || null,
                    order: sorter.order || null,
                  });
                  if (sorter.columnKey === 'sort') {
                    setSelectedHospitals((prev) =>
                      [...prev].sort((a, b) => {
                        const getOrder = (hospital: string) =>
                          manualOrder[hospital] || originalOrder.indexOf(hospital) + 1;
                        return sorter.order === 'ascend'
                          ? getOrder(a) - getOrder(b)
                          : getOrder(b) - getOrder(a);
                      })
                    );
                  }
                }
              }}
            />
          </SortableContext>
        </DndContext>
      </section>
    </main>
  );
}
